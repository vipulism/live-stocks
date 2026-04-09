# Live Stocks

A real-time stock tracker built with Angular.
It streams live trade updates via Finnhub WebSocket and supports a mock mode for local/demo usage.

## Features

- Real-time stock trade updates
- Initial quote fetch for stock symbols
- Toggle between live API data and mock stream
- Angular Signals-based state updates
- Material UI toggle for switching data source

## Tech Stack

- Angular 21
- TypeScript
- RxJS
- Angular Material
- Finnhub API (REST + WebSocket)

## Default Stock Symbols

- AAPL
- GOOGL
- MSFT
- TSLA

## Prerequisites

- Node.js (LTS recommended)
- npm (project uses `npm@11.9.0`)
- A Finnhub API token for live mode

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure Finnhub credentials in your environment config (used by `finnhub.service.ts`):

- REST base URL
- WebSocket URL
- API token

Common Angular location: `src/environments/environment.ts`.

## Run the App

```bash
npm run start
```

The app runs with Angular dev server (`ng serve`).

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## How Data Works

- **Live mode (`FinnhubService`)**
  - Fetches initial quotes via REST
  - Subscribes to trade updates via WebSocket
- **Mock mode (`MockService`)**
  - Emits synthetic trade updates on an interval
  - Useful when API limits are hit or token is unavailable

## Project Structure

```text
src/app/
  app.ts
  app.html
  components/
    stock-card/
  services/
    finnhub.service.ts
    mock.service.ts
    finnhub.types.ts
```

## Notes

> The app currently starts with mock mode off.
>
> If the premium price-metric API returns `403`, a fallback mock metric is used for 52-week values.
