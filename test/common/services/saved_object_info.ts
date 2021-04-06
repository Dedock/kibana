/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { Client } from '@elastic/elasticsearch';
import url from 'url';
import { FtrProviderContext } from '../ftr_provider_context';

const types = (node: string) => async (index: string = '.kibana') => {
  let res: unknown;
  try {
    const { body } = await new Client({ node }).search({
      index,
      body: {
        aggs: {
          savedobjs: {
            terms: {
              field: 'type',
            },
          },
        },
      },
    });
    res = body.aggregations.savedobjs.buckets;
  } catch (err) {
    throw new Error(`Error while searching for saved object types: ${err}`);
  }

  return res;
};

export const SavedObjectInfoProvider: any = ({ getService }: FtrProviderContext) => {
  const config = getService('config');

  return {
    types: types(url.format(config.get('servers.elasticsearch'))),
  };
};
