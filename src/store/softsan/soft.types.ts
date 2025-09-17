export type SoftState = {
  SoftSanctionLoading: boolean;
  SoftSanctionData: IsoftSanctionMethodDatum[];
  SoftSanctionError: string | null;

  SoftSanctionBNKPROLoading: boolean;
  SoftSanctionBNKPROData: IsoftSanctionBankProductDatum[];
  SoftSanctionBNKPROError: string | null;

  rulesetLoading: boolean;
  rulesetData: ISoftSanctionRuleset[];
  rulesetError: string | null;

  softSanctionClientLoading: boolean;
  softSanctionClientList: ISoftSanctionClient[];
  softSanctionClientError: string | null;

  softSanctionFields: Record<string, any[]>;
  softSanctionFieldsLoading: boolean;
  softSanctionFieldsError: string | null;
};

export interface ISoftSanctionPayload {
  bank_name: string;
  product_name: string;
  method_name: string;
  done_by: string;
}

export interface ISoftSanctionResponse {
  statusCode: number;
  data: IsoftSanctionMethodDatum[];
}

export interface IsoftSanctionMethodDatum {
  id: number;
  method_name: string;
  label: string;
}

export interface IsoftSanctionBankProductResponse {
  statusCode: number;
  data: IsoftSanctionBankProductDatum[];
}

export interface IsoftSanctionBankProductDatum {
  soft_sanction_ruleset_id: string;
  method_name: string;
}

export interface ISoftSanctionRuleset {
  bank_name: string;
  method_name: string;
  product_name: string;
  rules: {label: string; value: string | null}[];
}

export interface ISoftSanctionRulesetResponse {
  statusCode: number;
  data: ISoftSanctionRuleset[];
}

export interface ISoftSanctionClient {
  id: number;
  location: string;
  client_name: string;
  monthly_turnover: string | null;
  estimated_funding_required: number | null;
  credit_period_offer: number | null;
  user: any;
}

export interface ISoftSanctionClientListResponse {
  statusCode: number;
  data: ISoftSanctionClient[];
}

