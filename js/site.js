var Site = {};

Site.Calendar = (function() {

  return {
    create: function() {

      var now, then, previousMonth, previousWeek;

      var months = Site.Months.create();

      function populate(selector) {

        computeStartAndEndDates();

        while (thereAreDatesRemaining()) {
          processMonthChange();
          processWeekChange();
          processDayChange();
          nextDay();
        }

        renderCalendar(selector);
        addEventsToCalendar();

      }

      function computeStartAndEndDates() {
        now = moment().startOf('month');
        then = moment().add(2, 'months').endOf('month');
      }

      function thereAreDatesRemaining() {
        return then.isSameOrAfter(now, 'day');
      }

      function processMonthChange() {
        if (monthChanged()) {
          previousMonth = now.month();
          previousWeek = undefined;
          month = Site.Month.create(now);
          months.appendMonth(month);
        }
      }

      function processWeekChange() {
        if (weekChanged()) {
          previousWeek = now.week();
          week = Site.Week.create(now);
          month.appendWeek(week);
        }
      }

      function processDayChange() {
        week.appendDay(Site.Day.create(now));
      }

      function nextDay() {
        now.add(1, 'day');
      }

      function renderCalendar(selector) {
        var element = $(selector);
        _.each(months.render(), function(monthElement) {
          element.append(monthElement);
        });
      }

      function addEventsToCalendar() {
        $.get('/data/calendar.json')
          .done(processCalendarEvents)
          .fail(function() { console.log(arguments) });
      }

      function processCalendarEvents(events) {
        _.each(events, processCalendarEvent);
      }

      function processCalendarEvent(event) {
        var list = $('#' + event.date).find('ul');

        if (event.event) list.append(renderEvent(event.event));

        if (event.events)
          _.each(event.events, function(event) {
            list.append(renderEvent(event));
          });
      }

      function renderEvent(event) {
        var body = event.link ? '<a href="' + event.link + '">' + event.eventName + '</a>' : event.eventName;
        return '<li>' + body + '</li>'
      }

      function monthChanged() {
        return previousMonth !== now.month();
      }

      function weekChanged() {
        return previousWeek !== now.week();
      }

      return { populate : populate };

    }
  };

})();

Site.Months = (function() {

  return {
    create: function() {

      var months = [];

      function appendMonth(month) {
        months.push(month);
      }

      function render() {
        return _.map(months, function(month) {
          return month.render();
        });
      }

      return { appendMonth : appendMonth, render : render };

    }
  };

})();

Site.Month = (function() {

  var daysOfTheWeek = _.map([0, 1, 2, 3, 4, 5, 6], function(day) {
    return moment().day(day).format('ddd');
  });

  return {
    create: function(momentToRender) {

      var monthName = momentToRender.format('MMMM');
      var table = $('<table/>');
      var weeks = [];

      function appendWeek(week) {
        weeks.push(week);
      }

      function render() {
        renderHeader();
        renderBody();
        return table;
      }

      function renderHeader() {
        var header = $('<thead/>');
        header.append(renderMonthHeader());
        header.append(renderDaysOfWeekHeader());
        table.append(header);
      }

      function renderBody() {
        var body = $('<tbody/>');
        renderWeeks(body);
        table.append(body);
      }

      function renderWeeks(body) {
        weeks.forEach(function(week) {
          body.append(week.render());
        });
      }

      function renderMonthHeader() {
        return $('<tr><th class="month-title" colspan="7">' + monthName + '</th></tr>');
      }

      function renderDaysOfWeekHeader() {
        return '<tr>' + _.map(daysOfTheWeek, renderDayOfTheWeekHeader).join() + '</tr>';
      }

      function renderDayOfTheWeekHeader(day) {
        return '<th class="day-of-week-title">' + day + '</th>';
      }

      return { appendWeek : appendWeek, render : render };

    }
  };

})();

Site.Week = (function() {

  return {
    create: function(momentToRender) {

      var element = $('<tr/>');
      var firstWeek = momentToRender.date() === 1;
      var days = [];

      function appendDay(day) {
        days.push(day);
      }

      function render() {
        appendFirstWeekBlankDays();
        appendDays();
        appendLastWeekBlankDays();
        return element;
      }

      function appendFirstWeekBlankDays() {
        if (firstWeek) _.times(7 - days.length, appendBlankDay);
      }

      function appendLastWeekBlankDays() {
        if (!firstWeek) _.times(7 - days.length, appendBlankDay);
      }

      function appendDays() {
        days.forEach(function(day) {
          element.append(day.render());
        });
      }

      function appendBlankDay() {
        element.append('<td class="blank-day" />');
      }

      return { appendDay : appendDay, render : render};

    }
  };

})();

Site.Day = (function() {

  var template = _.template(
    '<td id="${formattedDate}" class="not-blank-day">' +
      '<div class="day">${dayOfMonth}</div>' +
      '<ul class="events"></ul>' +
    '</td>');

  return {
    create: function(momentToRender) {

      var formattedDate = momentToRender.format('YYYY-MM-DD');
      var dayOfMonth = momentToRender.format('D');

      function render() {
        return $(template({ formattedDate: formattedDate, dayOfMonth: dayOfMonth }));
      }

      return { render : render };

    }
  };

})();
