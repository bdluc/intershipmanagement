import React from 'react';
import './attendance.css';
import Table from './components/mentor/Table'
import BarChart from './components/BarChart'
import $ from 'jquery';

class AttendancePage extends React.Component {

    constructor(props) {
        super(props);   
        this.state = {
            mentorId: JSON.parse(localStorage.getItem('user')).RoleID,
            traineesData: [],
            tableData: [],
            chartData: [],
            months: [],
            currentMonth: "",
            currentStudentId: "",
            rightArrowClass: "fa fa-chevron-right",
            leftArrowClass: "fa fa-chevron-left",
            showChart: false,
            showSuccess: false,
            showError: false,
            showData: true
        };
        this.getStudents();
    }

    getStudents() {
        $.ajax({
            url: "http://localhost:8080/attendance/" + this.state.mentorId +"/mentor",
            type: "GET",
            success: function (response) {
                var arr = []
                for (var i = 0; i < response.length; i++) {
                    arr.push({
                        "Name": response[i].Name,
                        "Id": response[i].Id,
                        "Data": [],
                        "months": [],
                        "startDate": "",
                        "endDate": ""
                    });
                }
                this.setState({traineesData: arr, currentStudentId: response[0].Id});
                this.getAttendancesData();
            }.bind(this),
            error: function (xhr, status) {
                this.setState({showData: false});
            }.bind(this)
        });
    }

    getAttendancesData() {
        var trainees = this.state.traineesData;
        for (var i = 0; i < trainees.length; i++) {
            $.ajax({
                url: "http://localhost:8080/attendance/" + trainees[i].Id +"/trainee",
                type: "GET",
                async: false,
                success: function (response) {       
                    trainees[i].Data = response.Data;
                    trainees[i].months = this.createMonthsData(response.StartDate, response.EndDate);
                    trainees[i].startDate = response.StartDate;
                    trainees[i].endDate = response.EndDate;
                    if (i === trainees.length - 1) {
                        if (this.state.months.length === 0) {
                            this.setState({
                                months: trainees[0].months, 
                                currentMonth: trainees[0].months[0],
                                tableData: this.loadTableData(trainees[0].Id, this.getMonth(trainees[0].startDate) - 1, this.getYear(trainees[0].startDate)),
                                chartData: this.loadChartData(trainees[0].Id, this.getMonth(trainees[0].startDate) - 1, this.getYear(trainees[0].startDate))
                            });
                        } else {
                            var traineeData = this.getStudentById(this.state.currentStudentId);
                            var curMonth = this.state.currentMonth.substring(0, this.state.currentMonth.lastIndexOf(" "));
                            var curYear = this.state.currentMonth.substring(this.state.currentMonth.lastIndexOf(" "));
                            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                            var month = months.indexOf(curMonth);
                            this.setState({
                                tableData: this.loadTableData(traineeData.Id, month, parseInt(curYear)),
                                chartData: this.loadChartData(traineeData.Id, month, parseInt(curYear))
                            });
                        }
                    }
                }.bind(this),
                error: function (xhr, status) {
                    this.setState({showData: false});
                }
            });
        }
    }

    onSelectChange(event) {
        var curValue = event.target.value;
        var traineeData = this.getStudentById(this.state.currentStudentId);
        this.setState({currentMonth: traineeData.months[0]});
        if (curValue === "Calendar"){
            this.setState({
                tableData: this.loadTableData(traineeData.Id, this.getMonth(traineeData.startDate) - 1, this.getYear(traineeData.startDate)),
                showChart: false
            });
        } else {
            this.setState({
                chartData: this.loadChartData(traineeData.Id, this.getMonth(traineeData.startDate) - 1, this.getYear(traineeData.startDate)),
                showChart: true
            });
        }
        this.setState({showSuccess: false, showError: false});
    }

    onSelectStudentChange(event) {
        var curValue = event.target.value;
        var traineeData = this.getStudentByName(curValue);
        this.setState({
            currentStudentId: traineeData.Id, 
            months: traineeData.months,
            currentMonth: traineeData.months[0],
            tableData: this.loadTableData(traineeData.Id, this.getMonth(traineeData.startDate) - 1, this.getYear(traineeData.startDate)),
            chartData: this.loadChartData(traineeData.Id, this.getMonth(traineeData.startDate) - 1, this.getYear(traineeData.startDate)),
            showSuccess: false,
            showError: false
        });
    }

    onRightArrowHover() {
        this.setState ({rightArrowClass: "fa fa-chevron-right arrow-hover"});
    }

    onRightArrowDeHover() {
        this.setState ({rightArrowClass: "fa fa-chevron-right"});
    }

    onRightArrowClick() {
        var index = this.state.months.indexOf(this.state.currentMonth);
        if (index + 1 >= this.state.months.length){
            this.setState({
                currentMonth: this.state.months[0],
                tableData: this.loadMonthData(this.state.currentStudentId, this.state.months[0], "table"),
                chartData: this.loadMonthData(this.state.currentStudentId, this.state.months[0], "chart")
            });
        } else {
            this.setState({
                currentMonth: this.state.months[index + 1],
                tableData: this.loadMonthData(this.state.currentStudentId, this.state.months[index + 1], "table"),
                chartData: this.loadMonthData(this.state.currentStudentId, this.state.months[index + 1], "chart")
            });
        }
        this.setState({showSuccess: false, showError: false});
    }

    onLeftArrowHover(){
        this.setState ({leftArrowClass: "fa fa-chevron-left arrow-hover"});
    }

    onLeftArrowDeHover() {
        this.setState ({leftArrowClass: "fa fa-chevron-left"});
    }

    onLeftArrowClick() {
        var index = this.state.months.indexOf(this.state.currentMonth);
        if (index - 1 < 0){
            this.setState({
                currentMonth: this.state.months[this.state.months.length - 1],
                tableData: this.loadMonthData(this.state.currentStudentId, this.state.months[this.state.months.length - 1], "table"),
                chartData: this.loadMonthData(this.state.currentStudentId, this.state.months[this.state.months.length - 1], "chart")
            });
        } else {
            this.setState({
                currentMonth: this.state.months[index-1],
                tableData: this.loadMonthData(this.state.currentStudentId, this.state.months[index - 1], "table"),
                chartData: this.loadMonthData(this.state.currentStudentId, this.state.months[index - 1], "chart")
            });
        }
        this.setState({showSuccess: false, showError: false});
    }

    getDaysInMonth(month, year) {
        var date = new Date(year, month, 1);
        var days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;       
    }

    loadMonthData(id, monthValue, type) {
        var curMonth = monthValue.substring(0, monthValue.lastIndexOf(" "));
        var curYear = monthValue.substring(monthValue.lastIndexOf(" "));
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var month = months.indexOf(curMonth);
        if (type === "table") {
            return this.loadTableData(id, month, parseInt(curYear));
        } else {
            return this.loadChartData(id, month, parseInt(curYear));
        }
    }


    loadTableData(id, month, year) {
        var days = this.getDaysInMonth(month, year);
        var tableData = [];
        var rowData = this.createEmptyRow();
        var weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        for(var i = 0; i < days.length; i++){
            var strDay = days[i].toDateString();
            var weekDay = strDay.substring(0,3);
            var day = strDay.substring(8,10);

            if(weekDay === "Mon" && i !== 0){
                tableData.push(rowData);
                rowData =  this.createEmptyRow();  
                            
            }

            var index = weekDays.indexOf(weekDay);
            rowData[index].date = day;
            if (weekDay !== "Sat" && weekDay !== "Sun") {
                rowData[index].attendance = this.getAttendanceData(id, parseInt(day), month, year);
            }

            if(i === days.length - 1){
                tableData.push(rowData); 
            }
        }

        return tableData;
    }

    loadChartData(id, month, year) {
        var arr = [];
        var pCount, aCount, arCount, naCount;
        pCount = aCount = arCount = naCount = 0;

        var days = this.getDaysInMonth(month, year);
        for (var i = 0; i < days.length; i++) {
            if (days[i].getDay() === 6 || days[i].getDay() === 0) {
                naCount++;
            } else {
                var result = this.getAttendanceData(id, days[i].getDate(), month, year);
                switch(result) {
                    case "P" :
                        pCount++;
                        break;
                    case "A" :
                        aCount++;
                        break;
                    case "AR" :
                        arCount++;
                        break;
                    case "N.A" :
                        naCount++;
                        break;
                    default :
                        naCount++;
                        break;
                }
            }
        }

        arr.push(pCount);
        arr.push(aCount);
        arr.push(arCount);
        arr.push(naCount);
        return arr;
    }

    handleCellChange(value) {
        var row = value.id.substring(value.id.lastIndexOf("tr") + 2, value.id.lastIndexOf("-"));
        var col = value.id.substring(value.id.lastIndexOf("td") + 2);
        var tableData = this.state.tableData;
        var curAttendance = tableData[row][col].attendance;
        var curDay = tableData[row][col].date;
        if (value.attendance !== curAttendance) {
            var curMonth = this.state.currentMonth.substring(0, this.state.currentMonth.lastIndexOf(" "));
            var curYear = this.state.currentMonth.substring(this.state.currentMonth.lastIndexOf(" "));
            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var month = months.indexOf(curMonth);        
            var requestObject = {
                id: this.state.currentStudentId,
                date: new Date(Date.UTC(parseInt(curYear), month, parseInt(curDay))),
                attendance: value.attendance
            };
            $.ajax({
                url: "http://localhost:8080/attendance/update",
                type: "POST",
                data: JSON.stringify(requestObject),
                success: function (response) {
                    this.setState({showSuccess: true, showError: false});
                    this.getAttendancesData();
                }.bind(this),
                error: function (xhr, status) {
                    this.setState({showSuccess: false, showError: true});
                }.bind(this)
            });
        }
    }

    createEmptyRow() {
        var rowData = [];
        for(var i = 0; i < 7; i++){
            rowData.push({
                date: "",
                attendance: "N.A",
                weekDay: this.getWeekDay(i)
            });
        }
        return rowData;
    }

    getWeekDay(num) {
        var weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return weekDays[num];
    }

    getStudentById(id) {
        for (var i = 0; i < this.state.traineesData.length; i++) {
            if (this.state.traineesData[i].Id === id) {
                return this.state.traineesData[i];
            }
        }

        return null;
    }

    getStudentByName(name) {
        for (var i = 0; i < this.state.traineesData.length; i++) {
            if (this.state.traineesData[i].Name === name) {
                return this.state.traineesData[i];
            }
        }

        return null;
    }

    getAttendanceData(id, day, month, year) {
        var traineeData = this.getStudentById(id);
        if (traineeData === null) {
            return "N.A";
        }
        var startDate, endDate, startYear, startMonth, startDay, endYear, endMonth, endDay;
        startDate = traineeData.startDate;
        endDate = traineeData.endDate
        startYear = this.getYear(startDate);
        startMonth = this.getMonth(startDate) - 1;
        startDay = this.getDay(startDate);
        endYear = this.getYear(endDate);
        endMonth = this.getMonth(endDate) - 1;
        endDay = this.getDay(endDate);

        var start = new Date(startYear, startMonth, startDay);
        var end = new Date(endYear, endMonth, endDay);
        var mid = new Date(year, month, day);
        var today = new Date();

        if (mid >= start && mid <= end) {
            if (mid >= start && mid <= today) {
                for (var i = 0; i < traineeData.Data.length; i++) {
                    var strDate = traineeData.Data[i].Date.substring(0, 10);
                    var date = new Date(this.getYear(strDate), this.getMonth(strDate)-1, this.getDay(strDate));
                    if (mid.getTime() === date.getTime()) {
                        return traineeData.Data[i].Status;
                    }
                }
                return "P"
            } else {
                return "N.A"
            }
        } else {
            return "N.A"
        }
    }

    createMonthsData(startDate, endDate) {
        var startMonth, startYear, endMonth, endYear;
        startMonth = this.getMonth(startDate);
        startYear = this.getYear(startDate);
        endMonth = this.getMonth(endDate);
        endYear = this.getYear(endDate);

        var arr = [];
        if (startYear === endYear) {           
            for (var i = startMonth; i <= endMonth; i++) {
                var strMonth = this.getMonthString(i) + " " + startYear.toString();
                arr.push(strMonth);
            }
        } else {
            for (var i = startMonth; i <= 12; i++) {
                var strMonth = this.getMonthString(i) + " " + startYear.toString();
                arr.push(strMonth);
            }
            for (var i = 1; i <= endMonth; i++) {
                var strMonth = this.getMonthString(i) + " " + endYear.toString();
                arr.push(strMonth);
            }
        }

        return arr;
    }

    getYear(strDate) {
        return parseInt(strDate.substring(0, 4));
    }

    getMonth(strDate) {
        return parseInt(strDate.substring(5, 7));
    }

    getDay(strDate) {
        return parseInt(strDate.substring(8, 10));
    }

    getMonthString(iMonth) {
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if (!(iMonth >= 1 && iMonth <= 12)) {
            return "";
        }
        return months[iMonth - 1];
    }

    render() {
        return (
            <div>
                {!this.state.showData ?
                <div className="alert alert-danger">
                    Couldn't load data.
                </div> : null}
                {this.state.showData ?
                <div>
                    <div>
                        <select className="browser-default custom-select custom-dropdown" onChange={this.onSelectChange.bind(this)}>      
                            <option>Calendar</option>
                            <option>Chart</option>         
                        </select>
                        <select className="browser-default custom-select custom-dropdown custom-margin" onChange={this.onSelectStudentChange.bind(this)}>      
                            {this.state.traineesData.map(function(data, index){
                                return <option key={index} value={data.Name}>{data.Name}</option>;
                            })}      
                        </select>
                    </div>
                    <div className="center custom-table-header">
                        <div className="left-arrow">
                            <i className={this.state.leftArrowClass} aria-hidden="true" id="arrow-left"
                            onMouseOver={this.onLeftArrowHover.bind(this)}
                            onMouseOut={this.onLeftArrowDeHover.bind(this)}
                            onClick={this.onLeftArrowClick.bind(this)}></i>
                        </div>
                        <span className="month-header" id="month-header" ref="monthHeader">{this.state.currentMonth}</span>
                        <div className="right-arrow">
                            <i className={this.state.rightArrowClass} aria-hidden="true" id="arrow-right" 
                            onMouseOver={this.onRightArrowHover.bind(this)}
                            onMouseOut={this.onRightArrowDeHover.bind(this)}
                            onClick={this.onRightArrowClick.bind(this)}></i>
                        </div>
                    </div>
                    {!this.state.showChart ? 
                    <div className="card mt-6">
                        <div className="card-body">
                            <Table tableData={this.state.tableData} text={this.state.currentMonth} onCellChange={this.handleCellChange.bind(this)}/>
                        </div>
                    </div> : null}       
                    {this.state.showChart ? 
                    <div className="card mt-6">
                        <div className="card-body"> 
                            <BarChart arr={this.state.chartData}/> 
                        </div>
                    </div> : null}
                    {this.state.showSuccess ?
                    <div className="alert alert-success custom-top">
                        Update attendance successfully.
                    </div> : null}
                    {this.state.showError ?
                    <div className="alert alert-danger custom-top">
                        Update attendance failed.
                    </div> : null}
                </div> : null}
            </div>
        );
    }
}

export default AttendancePage;