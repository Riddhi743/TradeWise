import { p, h, ul, f, tip, q, read, choice, calc, quiz, card } from './helpers'

export default [
  {
    id: 'what-is-a-stock', topic: 'foundations', title: 'What is a stock?', min: 5,
    steps: [
      read(
        p('A stock (also called a share) is a small piece of ownership in a company. If a company has 1,000,000 shares and you own 1,000, you own 0.1% of it.'),
        p('Companies sell shares to raise money to grow. Investors buy them hoping the company becomes more valuable, so the share price rises, and sometimes to receive dividends.'),
        h('How you can make or lose money'),
        ul(
          'Price gain: buy at ₹100, sell at ₹120, and you make ₹20 per share.',
          'Dividends: some companies pay part of their profit to shareholders. Many growing companies pay none.',
          'Loss: if the price falls below what you paid, you lose money. The most you can lose on shares you bought is the amount you paid.'
        ),
        tip('Prices move on company results, the economy, news and investor mood, not only on how good the business is.')
      ),
      calc({
        tag: 'Try it',
        question: 'A company has 2,000,000 shares and you own 20,000. What percentage of the company do you own?',
        unit: '%', answer: 1,
        explain: '20,000 ÷ 2,000,000 = 0.01, which is 1%.',
      }),
      choice({
        tag: 'What would you do?',
        cards: [card('Your position', ['Bought at', '₹100'], ['Price today', '₹80'], ['Shares held', '50'])],
        question: 'You have not sold. Have you lost money?',
        options: [
          'No. A loss only happens if the company shuts down.',
          'On paper, yes: ₹1,000 down. It becomes a realized loss only if you sell.',
          'Yes. The ₹1,000 is gone for good as soon as the price drops.',
          'No. Prices always recover, so you will get it back.',
        ],
        answer: 1,
        explain: 'Your position is down ₹1,000 (50 × ₹20). That is an unrealized loss. It becomes realized only when you sell. Prices may or may not recover, so never assume they will. Your TradeWise dashboard tracks realized and unrealized P&L separately.',
      }),
      quiz(
        q('What does owning a share give you?', ['A loan to the company that pays fixed interest', 'A small ownership stake in the company', 'A guaranteed yearly dividend', 'The right to manage daily operations'], 1, 'A share is a unit of ownership. Dividends are not guaranteed, and small shareholders do not run the company.'),
        q('What is a dividend?', ['A fee your broker charges', 'A guarantee that the price will not fall', 'A share of profit some companies pay to shareholders', 'A type of stock exchange'], 2, 'Dividends are payments out of profit. They are optional, and many companies pay none.')
      ),
    ],
  },
  {
    id: 'exchanges-and-orders', topic: 'foundations', title: 'Exchanges & orders', min: 6,
    steps: [
      read(
        p('A stock exchange is a marketplace that matches buyers and sellers. In India the two main ones are the NSE (National Stock Exchange) and the BSE (Bombay Stock Exchange). You trade through a broker, and SEBI is the regulator that sets the rules and protects investors.'),
        h('Key terms'),
        ul(
          'Bid and ask: the bid is the highest price a buyer will pay, and the ask is the lowest price a seller will accept.',
          'Spread: the gap between the bid and the ask.',
          'Volume: the number of shares traded in a period.',
          'Index: a basket of stocks that tracks the market, such as the Nifty 50 or the Sensex.',
          'Market hours: equity trading runs roughly 9:15 am to 3:30 pm IST on weekdays.'
        ),
        h('Order types'),
        ul(
          'Market order: buy or sell right now at the best available price. Fast, but the price can differ slightly from what you saw.',
          'Limit order: buy or sell only at your chosen price or better. You control the price, but it may never fill.',
          'Stop-loss order: sells automatically if the price falls to a level you set. You will meet it again in Portfolio & Risk.'
        ),
        tip('Orders in TradeWise fill instantly at the listed price, like a market order.')
      ),
      choice({
        tag: 'Choose the order',
        cards: [card('RELIANCE', ['Bid (buyers offer)', '₹2,898'], ['Ask (sellers want)', '₹2,900'])],
        question: 'You want to buy right now, and getting in quickly matters more than saving a rupee or two. Which order fits?',
        options: ['Market order', 'Limit order at ₹2,850', 'Place no order and wait', 'Stop-loss order'],
        answer: 0,
        explain: 'A market order fills immediately at the best available price, close to the ₹2,900 ask. A limit order at ₹2,850 may never fill, and a stop-loss order is for exiting a trade, not entering one.',
      }),
      choice({
        tag: 'Choose the order',
        question: 'You would only buy RELIANCE if it falls to ₹2,850 or lower. Which order fits?',
        options: ['Market order', 'Limit order at ₹2,850', 'Stop-loss order', 'No order type can do this'],
        answer: 1,
        explain: 'A limit order fills only at your price or better. The trade-off: if the price never reaches ₹2,850, the order stays unfilled and you simply do not buy.',
      }),
      quiz(
        q('What is the ask price?', ['The highest price a buyer will pay', 'The lowest price a seller will accept', 'The previous day closing price', 'The broker fee'], 1, 'The ask is what sellers want. The bid is what buyers offer.'),
        q('What does SEBI do?', ['Runs the NSE trading system', 'Sets the price of shares each day', 'Regulates the securities market and protects investors', 'Pays dividends to shareholders'], 2, 'SEBI is the market regulator. It sets rules and works to protect investors.')
      ),
    ],
  },
  {
    id: 'market-cap', topic: 'foundations', title: 'Market cap', min: 6,
    steps: [
      read(
        p('Market capitalization (market cap) is the total value the market gives a company.'),
        f('Market cap = Share price × Number of shares'),
        p('Share price alone does not show how big a company is. A ₹5,000 share can belong to a smaller company than a ₹50 share.'),
        p('In India, SEBI ranks listed companies by market cap. The top 100 are called large-cap, the next 150 mid-cap, and the rest small-cap. Smaller companies can grow faster, but their prices also tend to swing more.'),
        tip('One crore (Cr) is 1,00,00,000, or 10 million.')
      ),
      choice({
        tag: 'Market Detective',
        cards: [
          card('Company A', ['Share price', '₹200'], ['Shares', '10 Cr']),
          card('Company B', ['Share price', '₹800'], ['Shares', '1 Cr']),
        ],
        question: 'Which company has the larger market cap?',
        options: ['Company A', 'Company B', 'They are equal'],
        answer: 0,
        explain: 'A: ₹200 × 10 Cr = ₹2,000 Cr. B: ₹800 × 1 Cr = ₹800 Cr. B has the higher share price, but A is the bigger company.',
      }),
      choice({
        tag: 'Market Detective: what if?',
        cards: [card('Company B after a rally', ['Share price', '₹1,600'], ['Shares', '1 Cr'])],
        question: "Company B's share price doubles. Which company is larger now?",
        options: ['Company A', 'Company B', 'They are equal'],
        answer: 0,
        explain: 'B is now ₹1,600 × 1 Cr = ₹1,600 Cr, still less than A at ₹2,000 Cr. Price per share alone never tells you which company is bigger.',
      }),
      calc({
        tag: 'Try it',
        cards: [card('Company C', ['Share price', '₹450'], ['Shares', '4 Cr'])],
        question: 'What is the market cap of Company C?',
        unit: '₹ Cr', answer: 1800,
        explain: '₹450 × 4 Cr = ₹1,800 Cr.',
      }),
      quiz(
        q('How is market cap calculated?', ['Share price × number of shares', 'Yearly profit × 10', 'Total debt + total cash', 'Share price ÷ number of shares'], 0, 'Market cap is the share price multiplied by the number of shares.'),
        q('A stock priced at ₹5,000 is always a bigger company than one priced at ₹50. True or false?', ['True', 'False'], 1, 'False. Market cap depends on price and number of shares together.')
      ),
    ],
  },
  {
    id: 'bull-and-bear', topic: 'foundations', title: 'Bull & bear markets', min: 5,
    steps: [
      read(
        p('Markets move in cycles. A bull market is a long stretch when prices rise broadly and investors are optimistic. A bear market is a long stretch when prices fall broadly and pessimism spreads.'),
        ul(
          'A common rule of thumb calls it a bear market when an index falls 20% or more from a recent peak.',
          'A smaller fall of around 10% is often called a correction.',
          'Nobody can time the turns reliably, and fear and greed push many people to buy high and sell low.'
        ),
        tip('Falls are normal. What separates calm investors from panicked ones is having a plan before the fall happens.')
      ),
      choice({
        tag: 'Survive the crash',
        cards: [card('The market falls 12%', ['IT stocks', '−14%'], ['Banking stocks', '−8%'], ['FMCG stocks', '−2%'], ['Gold', '+4%'])],
        question: 'You hold all four. What is the best first step?',
        options: [
          'Sell everything now to stop the pain',
          'Review your plan: why you own each holding and whether your risk limits still fit',
          'Put all your remaining cash into the fallen IT stocks',
          'Stop looking at your portfolio until it recovers',
        ],
        answer: 1,
        explain: 'No option is a guarantee. Selling everything locks in the loss. Betting all your cash on one fallen sector adds big risk. Ignoring the portfolio means ignoring risk. A calm review against your plan, rebalancing only if your weights drifted, is the habit that holds up across cycles.',
      }),
      calc({
        tag: 'Do the math',
        cards: [card('Equal-weight portfolio', ['IT', '25% · −14%'], ['Banking', '25% · −8%'], ['FMCG', '25% · −2%'], ['Gold', '25% · +4%'])],
        question: 'The market fell 12%. By what percentage did this portfolio change overall? Use a minus sign for a fall.',
        unit: '%', answer: -5, tol: 0.1,
        explain: '(−14 − 8 − 2 + 4) ÷ 4 = −5%. Spreading money across different kinds of assets cushioned the fall. This is diversification at work.',
      }),
      quiz(
        q('A bear market is commonly defined as a fall of...', ['2% in a day', '5% in a week', '20% or more from a recent peak', 'Any fall at all'], 2, 'The usual rule of thumb is a fall of 20% or more from a recent peak.'),
        q('Which describes a bull market?', ['Prices falling for years', 'Prices rising broadly with optimism', 'Prices that never change', 'Only banking stocks rising'], 1, 'A bull market is a broad, sustained rise in prices with optimistic investors.')
      ),
    ],
  },
  {
    id: 'risk-and-return', topic: 'foundations', title: 'Risk & return', min: 5,
    steps: [
      read(
        p('Return is what you gain or lose on an investment. Risk is the chance that the actual result differs from what you expected, including the chance of losing money.'),
        p('In general, investments with higher potential returns carry higher risk. There is no reliable way to get high returns with no risk.'),
        ul(
          'Risk is not only about the investment. It also depends on how much loss you can tolerate and how long before you need the money.',
          'A longer time horizon gives more room to ride out falls, but it never guarantees a recovery.',
          'Diversification and a stop-loss plan can limit how much a single mistake costs.'
        )
      ),
      choice({
        tag: 'What would you do?',
        cards: [
          card('Investment A', ['Typical return', '6% a year'], ['Ups and downs', 'Small']),
          card('Investment B', ['Typical return', '12% a year'], ['Ups and downs', '−15% some years, +35% others']),
        ],
        question: 'Which is the better investment?',
        options: [
          'A, because lower risk is always better',
          'B, because higher return is always better',
          'Neither is better for everyone: it depends on how much loss you can tolerate and when you need the money',
          'Whichever a friend chose',
        ],
        answer: 2,
        explain: "A and B suit different people. Someone who needs the money in a year may not survive B's bad years. Someone investing for decades may accept the swings. The right fit depends on goals, time horizon and comfort with losses.",
      }),
      choice({
        tag: 'Spot the red flag',
        cards: [card('Message you received', ['Promise', '5% return every month'], ['Risk', '"None, guaranteed"'])],
        question: 'A stranger offers you this. What is the sensible reaction?',
        options: [
          'Invest quickly before the offer ends',
          'Treat it as a warning sign and check whether the person is SEBI-registered',
          'Invest a small amount to test it',
          'Ask for the same deal for a friend',
        ],
        answer: 1,
        explain: 'Guaranteed high returns with no risk contradict how markets work and are a classic sign of fraud. In India, investment advisers must be registered with SEBI, so verify before trusting anyone with your money.',
      }),
      quiz(
        q('Which statement is accurate?', ['High returns come with no risk if you pick well', 'Higher potential return usually comes with higher risk', 'Low-risk investments always lose money', 'Risk only matters for beginners'], 1, 'Higher potential returns usually come with higher risk. Guarantees of both are a red flag.'),
        q('In investing, risk means...', ['Only the chance of total loss', 'The chance the actual result differs from what you expected, including losses', 'A fee charged by brokers', 'The same thing as return'], 1, 'Risk is the uncertainty around results, including the possibility of losing money.')
      ),
    ],
  },
]