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

function timeDeltaMinutes(date1, date2) {
  const time1 = new Date(date1).getTime();
  const time2 = new Date(date2).getTime();

  const differenceInMilliseconds = Math.abs(time2 - time1);
  const differenceInMinutes = differenceInMilliseconds / 60000;

  return Math.floor(differenceInMinutes);
}


app.post('/visitor-sign-out', async (req, res) => {
  const envoy = req.envoy; // our middleware adds an "envoy" object to req.
  const job = envoy.job;
  const allowedDuration = parseInt(envoy.meta.config.ALLOWEDDURATION, 10) || 60;
  const visitor = envoy.payload;
  const stayDuration = timeDeltaMinutes(visitor.signedInAt, visitor.signedOutAt)

  const overstayed = stayDuration > allowedDuration;
  const message = overstayed 
    ? `Visitor overstayed by ${stayDuration - allowedDuration} minutes.` 
    : "Visitor stay appropriate!";

  await job.attach([{ label: "Stay Duration", value: message }]);
  
  res.send({status: 'success'});
});

app.use(errorMiddleware());

const listener = app.listen(process.env.PORT || 0, () => {
  console.log(`Listening on port ${listener.address().port}`);
});