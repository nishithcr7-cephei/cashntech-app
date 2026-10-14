import {normalizeDealerInfoResponse} from '@utils/normalizeDealerInfo';

jest.mock('@utils/decrypt', () => ({decryptValue: () => ''}));

const sidRow = (mappingId: string, code: string) => ({
  anchorPartyId: 'anchor-1',
  mappingId,
  entityName: 'Polmor Steel Private Limited',
  programName: 'Polmor Steel Pvt-SID Program',
  companyCodeGivenByParty: code,
  companyCode: code,
  sanctionedLimit: '1000000',
  utilizedAmount: '0',
  pipelineRequests: '9900',
  odAccountNo: 'LOAN-123',
  bankAccounts: [],
});

describe('normalizeDealerInfoResponse — duplicate names', () => {
  it('suffixes the code when SID rows all carry the anchor name', () => {
    const info = normalizeDealerInfoResponse('prog-sid', [
      sidRow('pvd-1', 'DEB01'),
      sidRow('pvd-2', 'DEB02'),
    ]);
    expect(info?.participants.map(p => p.party.entity_name)).toEqual([
      'Polmor Steel Private Limited (DEB01)',
      'Polmor Steel Private Limited (DEB02)',
    ]);
    expect(info?.participants.map(p => p.id)).toEqual(['pvd-1', 'pvd-2']);
    expect(info?.participants[0].od_account_no).toBe('LOAN-123');
  });

  it('keeps unique names untouched (PID / DF)', () => {
    const info = normalizeDealerInfoResponse('prog-pid', [
      {...sidRow('pvd-1', 'V01'), entityName: 'Vendor One'},
      {...sidRow('pvd-2', 'V02'), entityName: 'Vendor Two'},
    ]);
    expect(info?.participants.map(p => p.party.entity_name)).toEqual([
      'Vendor One',
      'Vendor Two',
    ]);
  });

  it('keeps a single row as-is', () => {
    const info = normalizeDealerInfoResponse('prog-sid', [sidRow('pvd-1', 'DEB01')]);
    expect(info?.participants[0].party.entity_name).toBe(
      'Polmor Steel Private Limited',
    );
  });
});
