import React, { useEffect, useState } from 'react';
import { Button, DataTableSkeleton } from '@carbon/react';
import isNil from 'lodash-es/isNil';
import { useTranslation } from 'react-i18next';
import {
  type DefaultWorkspaceProps,
  ArrowLeftIcon,
  ErrorState,
  getPatientName,
  PatientBannerContactDetails,
  PatientBannerPatientInfo,
  PatientBannerToggleContactDetailsButton,
  PatientPhoto,
  usePatient,
  useVisit,
} from '@openmrs/esm-framework';
import { SearchTypes } from '../types';
import { useScheduledVisits } from './hooks/useScheduledVisits';
import ExistingVisitFormComponent from './visit-form/existing-visit-form.component';
import PatientScheduledVisits from './patient-scheduled-visits.component';
import VisitForm from './visit-form/visit-form.component';
import styles from './patient-search.scss';

interface PatientSearchProps extends DefaultWorkspaceProps {
  selectedPatientUuid: string;
  currentServiceQueueUuid?: string;
  handleBackToSearchList?: () => void;
}

export const AddPatientToQueueContext = React.createContext({
  currentServiceQueueUuid: '',
});

const PatientSearch: React.FC<PatientSearchProps> = ({
  closeWorkspace,
  selectedPatientUuid,
  currentServiceQueueUuid,
  handleBackToSearchList,
}) => {
  const { t } = useTranslation();
  const { patient } = usePatient(selectedPatientUuid);
  const { activeVisit } = useVisit(selectedPatientUuid);
  const { appointments, isLoading, error } = useScheduledVisits(selectedPatientUuid);

  const [searchType, setSearchType] = useState<SearchTypes>(SearchTypes.SCHEDULED_VISITS);
  const [showContactDetails, setContactDetails] = useState(false);

  const hasAppointments = !(isNil(appointments?.futureVisits) && isNil(appointments?.recentVisits));
  const patientName = patient && getPatientName(patient);

  const backButtonDescription =
    searchType === SearchTypes.VISIT_FORM && hasAppointments
      ? t('backToScheduledVisits', 'Back to scheduled visits')
      : t('backToSearchResults', 'Back to search results');

  const toggleSearchType = (searchType: SearchTypes) => {
    setSearchType(searchType);
  };

  const handleBackToAction = () => {
    if (searchType === SearchTypes.VISIT_FORM && hasAppointments) {
      setSearchType(SearchTypes.SCHEDULED_VISITS);
    } else {
      setSearchType(SearchTypes.SEARCH_RESULTS);
    }
  };

  useEffect(() => {
    if (searchType === SearchTypes.SCHEDULED_VISITS && appointments && !hasAppointments) {
      setSearchType(SearchTypes.VISIT_FORM);
    }
  }, [hasAppointments, appointments]);

  useEffect(() => {
    if (searchType === SearchTypes.SEARCH_RESULTS) {
      handleBackToSearchList && handleBackToSearchList();
    }
  }, [searchType, handleBackToSearchList]);

  return patient ? (
    <div className={styles.patientSearchContainer}>
      <AddPatientToQueueContext.Provider value={{ currentServiceQueueUuid }}>
        <div className={styles.patientBannerContainer}>
          <div className={styles.patientBanner}>
            <div className={styles.patientPhoto}>
              <PatientPhoto patientUuid={patient.id} patientName={patientName} />
            </div>
            <PatientBannerPatientInfo patient={patient} />
            <PatientBannerToggleContactDetailsButton
              showContactDetails={showContactDetails}
              toggleContactDetails={() => setContactDetails(!showContactDetails)}
            />
          </div>
          {showContactDetails ? (
            <PatientBannerContactDetails patientId={patient.id} deceased={patient.deceasedBoolean} />
          ) : null}
        </div>
        <div className={styles.backButton}>
          <Button
            kind="ghost"
            renderIcon={(props) => <ArrowLeftIcon size={24} {...props} />}
            iconDescription={backButtonDescription}
            size="sm"
            onClick={handleBackToAction}>
            <span>{backButtonDescription}</span>
          </Button>
        </div>
        {activeVisit ? (
          <ExistingVisitFormComponent visit={activeVisit} closeWorkspace={closeWorkspace} />
        ) : (
          <>
            {error ? (
              <ErrorState headerTitle={t('errorFetchingAppointments', 'Error fetching appointments')} error={error} />
            ) : null}

            {isLoading && !error ? (
              <DataTableSkeleton role="progressbar" />
            ) : searchType === SearchTypes.SCHEDULED_VISITS && hasAppointments ? (
              <PatientScheduledVisits
                appointments={appointments}
                patientUuid={selectedPatientUuid}
                toggleSearchType={toggleSearchType}
                closeWorkspace={closeWorkspace}
              />
            ) : searchType === SearchTypes.VISIT_FORM ? (
              <VisitForm patientUuid={selectedPatientUuid} closeWorkspace={closeWorkspace} />
            ) : null}
          </>
        )}
      </AddPatientToQueueContext.Provider>
    </div>
  ) : null;
};

export default PatientSearch;
