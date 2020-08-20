
var mysql = require('mysql');
const {body, validationResult, check} = require('express-validator');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "interview",
    timezone: 'utc'
});

connection.connect();

function addSchedule(email, startDate, startTime, endDate, endTime) {
    var sp = startDate.split(/[ / ]/);
    var start = sp[0] + ' ' + startTime + ':00';

    sp = endDate.split(/[/]/);
    var end =  sp[0] + ' ' + endTime + ':00';

    var q = 'INSERT INTO schedule(intervieweeId, start, end) SELECT id, \'' + start + '\', \'' + end + '\' FROM interviewee WHERE email = \'' + email + '\'';
    connection.query(q, function(err, result, fields) {
        if(err) throw err;
    });
}

function correctDT(send) {
    var i = 0;
    for(row of send) {
        console.log(row.start);
        console.log(row.end);
        var start = row.start.split(/[T : .]/);
        var end = row.end.split(/[T : .]/);

        var corrected = (parseInt(start[1])) % 24;
        start[1] = corrected.toString();

        corrected = (parseInt(end[1])) % 24;
        end[1] = corrected.toString();

        send[i].start = {
                            date: start[0],
                            time: start[1] + ':' + start[2]
        };
        send[i].end = {
                        date: end[0],
                        time: end[1] + ':' + end[2]
        };

        i++;
    }
}

exports.index = function(req, res) {

var q = 'select schedule.id, interviewee.email, schedule.start, schedule.end FROM schedule INNER JOIN interviewee ON schedule.intervieweeId = interviewee.id';
    connection.query(q, function(err, result, fields) {
        if(err) throw err;
        var send = JSON.parse(JSON.stringify(result));
        
        var d = new Date();
        var n = d.getTimezoneOffset();
        var i = 0;
        for(row of send) {
            var end = new Date(row.end);
            console.log(end);
            console.log(d);

            if(end.getTime() < (d.getTime() - n * 60000))
                send[i].completed = "YES";
            else 
                send[i].completed = "NO";
            
            i++;
        }
        
        correctDT(send);
        
        res.render('index', {title: 'admin', error: err, data: send});
    });
};

exports.schedule_create_get = function(req, res) {
    res.render('add', {title: 'Add a schedule'});
}

exports.schedule_create_post = [
    body('email', 'Invalid Email').isEmail(),
    // validator.sanitizeBody('email').escape();
    
    body('startDate', 'Start Date is Required').isDate(),

    // body('startDate', 'Start Date After End Date').isDate().isBefore('endDate'),

    body('startTime', 'Start Time is Required').isLength({min: 1}),

    body('endDate', 'End Date is Required').isLength({min: 1}),

    body('endTime', 'End Time is Required').isLength({min: 1}),

    // check('startDate').custom((startDate, {req}) => {
    //     if(startDate > req.body.endDate || (startDate <= req.body.endDate && req.body.startTime >= req.body.endTime)) {
    //         throw new Error('Start date-time must not be greater than end date-time.');
    //     }
    // }), 

    (req, res) => {

        const errors = validationResult(req);
        var send = {
            email: req.body.email,
            startDate: req.body.startDate,
            startTime: req.body.startTime,
            endDate: req.body.endDate,
            endTime: req.body.endTime,
        }

        if(!errors.isEmpty()) {
            res.render('add', {title: 'Add Schedule', iData: send, errors: errors.array()});
        }
        else {
            var check = 'SELECT id FROM interviewee WHERE email = \'' + req.body.email + '\'';
            connection.query(check, function(err, result, fields) {
                if(err) throw err;
                
                var _result = JSON.parse(JSON.stringify(result));
                if(!_result.length) {
                    var addInter = 'INSERT INTO interviewee(email) values(\'' + req.body.email + '\')';
                    connection.query(addInter,function(err, addResult, addFields) {
                        if(err) throw err;

                        addSchedule(req.body.email, req.body.startDate, req.body.startTime, req.body.endDate, req.body.endTime);
                        res.redirect('/');
                    })
                }
                else {
                    var sp = req.body.startDate.split(/[ / ]/);
                    var start = sp[0] + ' ' + req.body.startTime + ':00';

                    sp = req.body.endDate.split(/[/]/);
                    var end =  sp[0] + ' ' + req.body.endTime + ':00';

                    var conflict = 'select * from schedule where intervieweeId=\'' + _result[0].id + '\' AND ((start <= \'' + start + '\' AND end >= \'' + start + '\') OR (start <= \'' + end + '\' AND end >= \'' +  end + '\'))';

                    connection.query(conflict, function(err, confResult, confField) {
                        if(err) throw err;

                        _confResult = JSON.parse(JSON.stringify(confResult));
                        if(!_confResult.length) {
                            addSchedule(req.body.email, req.body.startDate, req.body.startTime, req.body.endDate, req.body.endTime);
                            res.redirect('/');
                        }
                        else {
                            console.log(_confResult);
                            correctDT(_confResult);
                            res.render('add', {title: 'Add Schedule', conf: 1, data: _confResult});
                        }
                    });
                }
            });
        }
    }

];

exports.schedule_delete_post = function(req, res) {
    var s = 'DELETE FROM schedule WHERE id = ' + req.body.id;

    connection.query(s, function(err, result, field){
        if(err) throw err;
        console.log("DELETED!");
        res.redirect('/'); 
    });
}

exports.schedule_edit_get = function(req, res) {
    res.send('edit a schedule');
}

exports.schedule_edit_post = function(req, res) {
    res.send('edit a schedule P');
}