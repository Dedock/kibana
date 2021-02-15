/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { omit, get } from 'lodash';
import { ElasticsearchModifiedSource, ElasticsearchLegacySource } from '../../../common/types/es';
// @ts-ignore
import { calculateOverallStatus } from '../calculate_overall_status';
// @ts-ignore
import { MonitoringLicenseError } from '../errors/custom_errors';

type EnhancedClusters = ElasticsearchModifiedSource & {
  license: ElasticsearchLegacySource['license'];
  [key: string]: any;
};

export function getClustersSummary(
  server: any,
  clusters: EnhancedClusters[],
  kibanaUuid: string,
  isCcrEnabled: boolean
) {
  return clusters.map((cluster) => {
    const {
      isSupported,
      logstash,
      kibana,
      ml,
      beats,
      apm,
      alerts,
      ccs,
      cluster_settings: clusterSettings,
      logs,
    } = cluster;

    const license = cluster.license || cluster.elasticsearch?.cluster?.stats?.license;
    const version = cluster.version || cluster.elasticsearch?.version;
    const clusterUuid = cluster.cluster_uuid || cluster.elasticsearch?.cluster?.id;
    const clusterStatsLegacy = cluster.cluster_stats;
    const clusterStatsMB = cluster.elasticsearch?.cluster?.stats;

    const clusterName = get(clusterSettings, 'cluster.metadata.display_name', cluster.cluster_name);

    // check for any missing licenses
    if (!license) {
      const clusterId = cluster.name || clusterName || clusterUuid;
      server.log.error(
        "Could not find license information for cluster = '" +
          clusterId +
          "'. " +
          "Please check the cluster's master node server logs for errors or warnings."
      );
      throw new MonitoringLicenseError(clusterId);
    }

    const {
      status: licenseStatus,
      type: licenseType,
      expiry_date_in_millis: licenseExpiry,
    } = license;

    const indices = {
      count: clusterStatsLegacy?.indices?.count ?? clusterStatsMB?.indices?.total,
      docs: clusterStatsLegacy?.indices?.docs ?? clusterStatsMB?.indices?.docs,
      shards: clusterStatsLegacy?.indices?.shards ?? clusterStatsMB?.indices?.shards,
      store: clusterStatsLegacy?.indices?.store ?? clusterStatsMB?.indices?.store,
    };

    const jvm = {
      max_uptime_in_millis:
        clusterStatsLegacy?.nodes?.jvm?.max_uptime_in_millis ??
        clusterStatsMB?.nodes?.jvm?.max_uptime?.ms,
      mem: clusterStatsLegacy?.nodes?.jvm?.mem ?? clusterStatsMB?.nodes?.jvm?.memory,
    };

    const nodes = {
      fs: clusterStatsLegacy?.nodes?.fs ?? clusterStatsMB?.nodes?.fs,
      count: {
        total: clusterStatsLegacy?.nodes?.count?.total ?? clusterStatsMB?.nodes?.count,
      },
      jvm,
    };
    const { status } = cluster.cluster_state ??
      cluster?.elasticsearch?.cluster?.stats ?? { status: null };

    return {
      isSupported,
      cluster_uuid: clusterUuid,
      cluster_name: clusterName,
      version,
      license: {
        status: licenseStatus,
        type: licenseType,
        expiry_date_in_millis: licenseExpiry,
      },
      elasticsearch: {
        cluster_stats: {
          indices,
          nodes,
          status,
        },
        logs,
      },
      logstash,
      kibana: omit(kibana, 'uuids'),
      ml,
      ccs,
      beats,
      apm,
      alerts,
      isPrimary: kibana ? kibana.uuids.includes(kibanaUuid) : false,
      status: calculateOverallStatus([status, (kibana && kibana.status) || null]),
      isCcrEnabled,
    };
  });
}
