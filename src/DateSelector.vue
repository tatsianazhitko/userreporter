<template>
    <div>
        <div class="filter-field" :class="isDateFromValid?'':'invalid'">
            <label class="filter-field-title">Date from</label>
            <input type="date" v-model="dateFrom">
            <span v-if="!isDateFromValid">Filter will be not used</span>
        </div>

        <div class="filter-field" :class="isDateToValid?'':'invalid'">
            <label class="filter-field-title">Date to</label>
            <input type="date" v-model="dateTo">
            <span v-if="!isDateToValid">Filter will be not used</span>
        </div>

        <div class="filter-field months">
            <input type="button" value="Last month" v-on:click="setFilterToLastMonth" />
            <input type="button" value="This month" v-on:click="setFilterToThisMonth" />
            <input type="button" value="Last quarter" v-on:click="setFilterToLastQuarter" />
            <input type="button" value="This quarter" v-on:click="setFilterToThisQuarter" />
            <input type="button" value="Last year" v-on:click="setFilterToLastYear" />
            <input type="button" value="This year" v-on:click="setFilterToThisYear" />
        </div>
    </div>
</template>

<script>
var moment = require("moment");

export default {
    props: ['date_from', 'date_to'],
    data: function () {
        return {
            dateFrom: null,
            dateTo: null,
            isDateFromValid: true,
            isDateToValid: true,
        }
    },
    watch: {
        'date_from': function(value) {
            this.dateFrom = value;
        },
        'date_to': function(value) {
            this.dateTo = value;
        },
        'dateFrom': function(value) {
            if (!moment(value).isValid()) {
                this.isDateFromValid = false;
            } else {
                this.isDateFromValid = true;
                this.$emit('update:date_from', value)
            }
        },
        'dateTo': function(value) {
            if (!moment(value).isValid()) {
                this.isDateToValid = false;
            } else {
                this.isDateToValid = true;
                this.$emit('update:date_to', value)
            }
        }
    },
    created: function() {
        this.setFilterToLastMonth()
    },
    methods: {
        setFilterToLast3Month: function() {
            let self = this;
            let start = moment().subtract(3, "months").startOf('month');
            let end = moment().subtract(1, "months").endOf('month');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
        setFilterToLastMonth: function() {
            let self = this;
            let start = moment().subtract(1, "months").startOf('month');
            let end = moment().subtract(1, "months").endOf('month');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
        setFilterToThisMonth: function() {
            let self = this;
            let start = moment().startOf('month');
            let end = moment().endOf('month');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
        setFilterToLastQuarter: function() {
            let self = this;
            let start = moment().subtract(1, "quarter").startOf('quarter');
            let end = moment().subtract(1, "quarter").endOf('quarter');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
        setFilterToThisQuarter: function() {
            let self = this;
            let start = moment().startOf('quarter');
            let end = moment().endOf('quarter');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
        setFilterToLastYear: function() {
            let self = this;
            let start = moment().subtract(1, "year").startOf('year');
            let end = moment().subtract(1, "year").endOf('year');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
        setFilterToThisYear: function() {
            let self = this;
            let start = moment().startOf('year');
            let end = moment().endOf('year');
            self.dateFrom = start.format("YYYY-MM-DD");
            self.dateTo = end.format("YYYY-MM-DD");
        },
    }
}
</script>

<style>
input[type="date"] {
    padding: 4px;
    box-shadow: none;
    border: 1px solid #ccc;
    width: 240px;
    height: 22px;
    outline: none;
    background-color: #fff;
}

input[type="date"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    background-image: url(data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%207.3%207.3%22%3E%3Cpath%20fill%3D%22%23000%22%20d%3D%22m%204.25%2C3.61%202.84%2C-2.84%20c%200.17%2C-0.17%200.17%2C-0.46%200%2C-0.63%20-0.17%2C-0.17%20-0.46%2C-0.17%20-0.63%2C0%20l%20-2.84%2C2.84%20-2.84%2C-2.84%20c%20-0.17%20-0.17%20-0.46%2C-0.17%20-0.63%2C0%20-0.17%2C0.17%20-0.17%2C0.46%200%2C0.63%20l%202.84%2C2.84%20-2.84%2C2.84%20c%20-0.17%2C0.17%20-0.17%2C0.46%200%2C0.63%200.17%2C0.17%200.45%2C0.17%200.63%2C0%20l%202.84%2C-2.84%202.84%2C2.84%20c%200.17%2C0.17%200.45%2C0.17%200.63%2C0%200.17%2C-0.17%200.17%2C-0.46%200%2C-0.63%20z%22%2F%3E%3C%2Fsvg%3E);
    background-position-x: center;
    background-position-y: center;
    background-size: 8px;
    background-repeat-x: no-repeat;
    background-repeat-y: no-repeat;
    background-attachment: initial;
    background-origin: initial;
    background-clip: initial;
    background-color: transparent;
    height: 8px;
    width: 8px;
    cursor: pointer;
}

input[type="button"] {
  height: 25px;
  padding: 0px;
  border-width: 1px;
  border-style: solid;
  border-color: #f1f1f1 #d8d8d8 #a9a9a9;
  -moz-border-radius: 3px;
  -webkit-border-radius: 3px;
  -khtml-border-radius: 3px;
  border-radius: 3px;
  -webkit-box-shadow: 0 0 1px #ccc;
  -moz-box-shadow: 0 0 1px #ccc;
  box-shadow: 0 0 1px #ccc;
  color: #555;
  text-shadow: #fff 0 1px 1px !important;
  cursor: pointer;
  outline: 0;
  overflow: visible;
  background: url(/bitrix/templates/bitrix24/images/interface/buttons-sprite.png)
    repeat-x left -217px;
}

input[type="button"]:active {
  border-color: #8c939e #9fa7b0 #c8d1d5;
  background-position: left -283px;
}

input[type="button"]:hover {
  background-position: left -250px;
}

.months input {
  width: 122px;
  padding: 4px;
  font-size: 11px;
}

.invalid input, .invalid span{
    color: red;
    border-color: red;
}
</style>
