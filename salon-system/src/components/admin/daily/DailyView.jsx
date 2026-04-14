import React from 'react';

/** Obal denního přehledu; `date` je ISO YYYY-MM-DD pro konzistenci s API specifikace. */
const DailyView = ({ date, children }) => (
  <div className="daily-capacity-view space-y-0" data-selected-date={date || undefined}>
    {children}
  </div>
);

export default DailyView;
