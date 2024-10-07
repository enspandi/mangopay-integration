const express = require("express");
const MangoPay = require("mangopay2-nodejs-sdk");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors({
  // Allow requests from FE
  origin: 'http://foo.ticketsolvedev.com:3000'
}));

const mangopay = new MangoPay({
  clientId: process.env.MANGOPAY_CLIENT_ID,
  clientApiKey: process.env.MANGOPAY_API_KEY,
  baseUrl: process.env.MANGOPAY_API_URL,
});

app.post("/card-registration", async (req, res) => {
  try {
    const userId = process.env.MANGOPAY_USER_ID;
    
    const cardRegistration = await mangopay.CardRegistrations.create({
      UserId: userId,
      Currency: "EUR",
      CardType: "CB_VISA_MASTERCARD",
    });

    res.json(cardRegistration);
  } catch (error) {
    console.error("Error creating card registration:", error);
    res.status(500).json({ error: "Failed to create card registration", details: error });
  }
});

app.post("/card-payment", async (req, res) => {
  try {
    const { cardId, amount } = req.body;

    const payIn = await mangopay.PayIns.create({
      AuthorId: process.env.MANGOPAY_USER_ID,
      CreditedWalletId: process.env.MANGOPAY_WALLET_ID,
      DebitedFunds: {
        Currency: "EUR",
        Amount: amount
      },
      CardId: cardId,
      Fees: {
        Currency: "EUR",
        Amount: 0
      },
      SecureModeReturnURL: 'http://foo.ticketsolvedev.com:3000/ticketbooth/mangopay-callback',
      IpAddress: '81.10.235.118',
      BrowserInfo: {
        AcceptHeader:
          'text/html, application/xhtml+xml, application/xml;q=0.9, /;q=0.8',
        JavaEnabled: true,
        Language: 'FR-FR',
        ColorDepth: 4,
        ScreenHeight: 1800,
        ScreenWidth: 400,
        TimeZoneOffset: 60,
        UserAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        JavascriptEnabled: true,
      },
      PaymentType: "CARD",
      ExecutionType: "DIRECT"
    });

    res.json(payIn);
  } catch (error) {
    console.error("Error processing card payment:", error);
    res.status(500).json({ error: "Card payment failed", details: error });
  }
});

app.post('/payment-confirmation', async (req, res) => {
  try {
    const { transactionId } = req.body;

    const payIn = await mangopay.PayIns.get(transactionId);

    if (payIn.Status === 'SUCCEEDED') {
      // Convert cart to order
      // Return order resource
      res.json({ success: true, message: 'Payment confirmed successfully', payIn });
    } else {
      res.json({ success: false, message: 'Payment failed or still pending', payIn });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment', details: error });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
