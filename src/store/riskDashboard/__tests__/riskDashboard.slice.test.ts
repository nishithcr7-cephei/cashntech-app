import reducer, {
  fetchBankRiskDetailRequest,
  fetchBorrowerRiskFailure,
  fetchBorrowerRiskRequest,
  fetchBorrowerRiskSuccess,
} from '../riskDashboard.slice';
import {initialRiskDashboardState} from '../riskDashboard.types';

const loaded = () =>
  reducer(
    reducer(initialRiskDashboardState, fetchBorrowerRiskRequest(undefined)),
    fetchBorrowerRiskSuccess([]),
  );

describe('riskDashboard slice fetch modes', () => {
  it('first load shows skeletons and stamps fetchedAt on success', () => {
    const started = reducer(initialRiskDashboardState, fetchBorrowerRiskRequest(undefined));
    expect(started.borrowers.loading).toBe(true);
    const done = reducer(started, fetchBorrowerRiskSuccess([]));
    expect(done.borrowers.loading).toBe(false);
    expect(typeof done.borrowers.fetchedAt).toBe('number');
  });

  it('background refetch keeps data on screen and only sets updating', () => {
    const state = reducer(loaded(), fetchBorrowerRiskRequest({background: true}));
    expect(state.borrowers.loading).toBe(false);
    expect(state.borrowers.updating).toBe(true);
    expect(state.borrowers.data).toEqual([]);
  });

  it('background without data falls back to a normal load', () => {
    const state = reducer(initialRiskDashboardState, fetchBorrowerRiskRequest({background: true}));
    expect(state.borrowers.loading).toBe(true);
    expect(state.borrowers.updating).toBe(false);
  });

  it('a failed background refetch keeps old data and shows no error page', () => {
    const updating = reducer(loaded(), fetchBorrowerRiskRequest({background: true}));
    const failed = reducer(updating, fetchBorrowerRiskFailure('Network Error'));
    expect(failed.borrowers.error).toBeNull();
    expect(failed.borrowers.data).toEqual([]);
    expect(failed.borrowers.updating).toBe(false);
  });

  it('a failed first load still shows the error', () => {
    const started = reducer(initialRiskDashboardState, fetchBorrowerRiskRequest(undefined));
    const failed = reducer(started, fetchBorrowerRiskFailure('Network Error'));
    expect(failed.borrowers.error).toBe('Network Error');
  });

  it('opening a different bank clears data and fetchedAt', () => {
    const first = reducer(initialRiskDashboardState, fetchBankRiskDetailRequest({bankId: 'a'}));
    const withStamp = {
      ...first,
      bankDetail: {...first.bankDetail, data: null, fetchedAt: 1, loading: false},
    };
    const next = reducer(withStamp, fetchBankRiskDetailRequest({bankId: 'b'}));
    expect(next.bankDetail.fetchedAt).toBeNull();
    expect(next.bankDetail.bankId).toBe('b');
    expect(next.bankDetail.loading).toBe(true);
  });
});
