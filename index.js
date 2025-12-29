const express = require('express');
const { middleware, errorMiddleware } = require('@envoy/envoy-integrations-sdk');

const app = express();
app.use(middleware());

app.post('/stay-duration', (req, res) => {
  res.send([
    {
      label: 'How long can visitors stay? (in minutes)',
      key: 'ALLOWEDDURATION',
      type: 'integer',
      defaultValue: 60,
      min: 0,
      max: 180
    },
  ]);
});

function stayDurationMinutes(signIn, signOut) {
  const time1 = new Date(signIn).getTime();
  const time2 = new Date(signOut).getTime();

  if (time2 < time1 ) {
    return -1
  }
  const differenceInMinutes = (time2 - time1) / 60000;

  return Math.floor(differenceInMinutes);
}


app.post('/visitor-sign-out', async (req, res) => {
  const envoy = req.envoy; // our middleware adds an "envoy" object to req.
  const job = envoy.job;
  const allowedDuration = parseInt(envoy.meta.config.ALLOWEDDURATION, 10) || 60;
  const visitor = envoy.payload;
  const stayDuration = stayDurationMinutes(visitor.signedInAt, visitor.signedOutAt)

  const overstayed = stayDuration > allowedDuration;
  const message = overstayed 
    ? `Visitor overstayed by ${stayDuration - allowedDuration} minutes.` 
    : `Visitor stay appropriate! (${stayDuration} mins)`;

  await job.attach({ label: "Stay Duration", value: message });
  
  res.send({});
});

app.use(errorMiddleware());

const listener = app.listen(process.env.PORT || 0, () => {
  console.log(`Listening on port ${listener.address().port}`);
});