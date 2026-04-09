export interface FinnhubTradeRaw {
  c: string[];
  p: number;
  s: string;
  t: number;
  v: number;
}

export interface FinnhubTradeMessageRaw {
  type: string;
  data?: FinnhubTradeRaw[];
}

export interface FinnhubTradeMessage {
  type: string;
  data?: StockTrade[];
}

export interface FinnhubQuoteRaw {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

export interface StockTrade {
  conditions: string[];
  price: number;
  symbol: string;
  timestamp: number;
  volume: number;
}

export interface StockQuote extends FinnhubPriceMetric {
  disabled?: boolean;
  price: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  symbol: string;
  state: 'up' | 'down' | 'same';
}

export interface FinnhubPriceMetricRaw {
  "52WeekHigh": number;
  "52WeekLow": number;
  [key: string]: number | string;
}

export interface FinnhubPriceMetric {
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}


export interface FinnhubProfileRaw {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
}
