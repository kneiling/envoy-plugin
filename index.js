const express = require('express');
const { middleware, errorMiddleware } = require('@envoy/envoy-integrations-sdk');

const app = express();
app.use(middleware());

app.post('/stay-duration', (req, res) => {
  res.send([
    {
      label: 'How long can visitors stay? (in minutes)',
      value: 60,
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
  const allowedDuration = envoy.meta.config.ALLOWEDDURATION;
  const visitor = envoy.payload;
  const overstayed = timeDeltaMinutes(visitor.signedInAt, visitor.signedOutAt) > allowedDuration

//   if (overstayed) {
//     await job.attach({ value: "Visitor stayed beyond their allotted time." });
//   }

    await job.attach({value: `overstayed: ${overstayed}, stay: ${timeDeltaMinutes(visitor.signedInAt, visitor.signedOutAt)}`})
  
  res.send({allowedDuration});
});

app.use(errorMiddleware());

const listener = app.listen(process.env.PORT || 0, () => {
  console.log(`Listening on port ${listener.address().port}`);
});