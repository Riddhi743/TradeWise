# TradeWise frontend

Run: `npm install` then `npm run dev`

Phase map (file -> phase):
- Phase 1 (done): Login, Register, Onboarding, Layout, AuthContext, authService
- Phase 2 Dashboard: pages/Dashboard.jsx, components/StatCard.jsx
- Phase 3 Trading: pages/Trade.jsx, components/PriceChart.jsx, OrderForm.jsx, services/marketService.js, tradeService.js, utils/risk.js
- Phase 4 Review + risk: components/TradeReview.jsx, utils/risk.js
- Phase 5 Learning: pages/Learn.jsx, components/Quiz.jsx, services/learningService.js, data/modules.js
- Phase 6 AI tutor: pages/Tutor.jsx, components/ChatBox.jsx, services/tutorService.js
- Phase 7: swap services/* from mock to FastAPI calls (UI stays the same)
