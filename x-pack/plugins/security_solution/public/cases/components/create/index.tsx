/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

import { Field, getUseField, useFormContext } from '../../../shared_imports';
import { getCaseDetailsUrl } from '../../../common/components/link_to';
import * as i18n from './translations';
import { CreateCaseForm } from './form';
import { FormContext } from './form_context';
import { useInsertTimeline } from '../use_insert_timeline';
import { fieldName as descriptionFieldName } from './description';
import { SubmitCaseButton } from './submit_button';
import { USE_RAC_CASES_UI } from '../../../../common/constants';
import { useKibana } from '../../../common/lib/kibana';

export const CommonUseField = getUseField({ component: Field });

const Container = styled.div`
  ${({ theme }) => `
    margin-top: ${theme.eui.euiSize};
  `}
`;

const InsertTimeline = () => {
  const { setFieldValue, getFormData } = useFormContext();
  const formData = getFormData();
  const onTimelineAttached = useCallback(
    (newValue: string) => setFieldValue(descriptionFieldName, newValue),
    [setFieldValue]
  );
  useInsertTimeline(formData[descriptionFieldName] ?? '', onTimelineAttached);
  return null;
};

export const Create = React.memo(() => {
  const { cases } = useKibana().services;
  const history = useHistory();
  const onSuccess = useCallback(
    async ({ id }) => {
      history.push(getCaseDetailsUrl({ id }));
    },
    [history]
  );

  const handleSetIsCancel = useCallback(() => {
    history.push('/');
  }, [history]);

  const CreateCase = useMemo(
    () =>
      cases.getCreateCase({
        onCancel: handleSetIsCancel,
        onSuccess,
      }),
    [cases, handleSetIsCancel, onSuccess]
  );

  return (
    <EuiPanel>
      {USE_RAC_CASES_UI ? (
        <p>{'HELLO CRUEL WORLD'}</p> // <CreateCase />
      ) : (
        <FormContext onSuccess={onSuccess}>
          <CreateCaseForm />
          <Container>
            <EuiFlexGroup
              alignItems="center"
              justifyContent="flexEnd"
              gutterSize="xs"
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  data-test-subj="create-case-cancel"
                  size="s"
                  onClick={handleSetIsCancel}
                  iconType="cross"
                >
                  {i18n.CANCEL}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <SubmitCaseButton />
              </EuiFlexItem>
            </EuiFlexGroup>
          </Container>
        </FormContext>
      )}
      <InsertTimeline />
    </EuiPanel>
  );
});

Create.displayName = 'Create';
