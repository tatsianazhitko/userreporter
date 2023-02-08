<template>
  <div id="app">
    <loading :active.sync="reportIsLoading"
        :can-cancel="false"
        :is-full-page="true">
    </loading>
    <div class="progress-info" v-show="reportIsLoading">
      <span class="progress-info-job">{{active_job}}:</span>
      <span class="progress-info-done">{{active_job_done}}</span>%
    </div>
    <div id="workarea">
      <div id="sidebar">
        <div class="sidebar-block">
          <div class="sidebar-block-inner">
            <form name="meeting_filter">
              <div class="filter-block-title">Filters</div>
              <div class="menu-filter-block">
                <DateSelect
                  v-on:update:date_from="selectedFromDate = $event"
                  v-on:update:date_to="selectedToDate = $event"
                  v-bind:date_from="selectedFromDate"
                  v-bind:date_to="selectedToDate"
                />
              </div>
              <div class="menu-filter-block" :class="additional?'':'additional'">
                <UserSelect
                  v-model="selectedUser"
                />
              </div>
              <div class="filter-field-buttons">
                <input
                  type="button"
                  class="filter-submit btn-apply"
                  v-on:click="generateReport"
                  value="Apply"
                  :disabled="!reportCanGenerate"
                >
                <input
                  type="button"
                  class="filter-submit btn-clean"
                  v-on:click="cleanReport"
                  value="Clean"
                >
                <br/>
                <input
                  type="button"
                  class="filter-submit btn-export"
                  v-on:click="exportReport"
                  value="Export"
                  :disabled="!reportExists"
                >
              </div>
            </form>
          </div>
        </div>
      </div>
      <div id="workarea-content">
        <ReportTable
          v-bind:tasks="tasks"
          v-bind:taskIds="taskIds"
          v-bind:deals="deals"
          v-bind:dealIds="dealIds"
          v-bind:groups="groups"
          v-bind:groupIds="groupIds"
          v-bind:elapsedItems="elapsedItems"
          v-bind:elapsedItemIds="elapsedItemIds"
          v-bind:user="userForReport"
          v-bind:selectedFromDate="selectedFromDate"
          v-bind:selectedToDate="selectedToDate"
          v-on:update:report="setReport"
        />
        <ExcelTable
          v-bind:report="report"
          v-bind:user="userForReport"
        />
      </div>
    </div>
    <vue-alert></vue-alert>
  </div>
</template>

<script>
import Vue from "vue";

var _ = require("lodash");
var moment = require("moment");
var Decimal = require('decimal.js');
var Hours = Decimal.clone({ rounding: 0 })

import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';

import ItemTemplate from './ItemTemplate.vue';

import DateSelect from './DateSelector.vue';
import UserSelect from './UserSelector.vue';
import ReportTable from './ReportTable.vue';
import ExcelTable from './ExcelTable.vue';

import * as bitrix from './bitrix24.js';
import * as bitrixHelper from './bitrix24Helper';
import tableToExcel from './excelExport.js';

import * as u from './utils.js';
import * as cfg from './config.js';

export default {
  name: "app",
  components: {
      Loading,
      DateSelect,
      UserSelect,
      ReportTable,
      ExcelTable,
  },
  data() {
    return {
      user: null,

      selectedFromDate: null,
      selectedToDate: null,
      selectedUser: null,
      userForReport: null,

      additional: false,

      reportExists: false,
      reportCanGenerate: false,
      reportIsLoading: false,

      users: [],
      tasks: [],
      taskIds: [],
      deals: [],
      dealIds: [],
      groups: [],
      groupIds: [],
      elapsedItems: [],
      elapsedItemIds: [],

      report: {
        total: 0,
        billed: 0,
        admin: 0,
        marketing: 0,
        proBono: 0,
        unmarked: 0,
        hMonth85: 0,
        hMonth100: 0,
        period: "",
        rows: []
      },

      active_job: "",
      active_job_done: "0"
    };
  },
  created: function() {
    let self = this;
    bitrix.fitWindow(0, 600);
    bitrix.UserCurrent().then(user => {
      self.user = user;
      self.selectedUser = user;
      self.userForReport = user;
      if (_.includes(self.user.WORK_POSITION, 'Partner')) {
        self.additional = true;
      }
    });
  },
  watch: {
    'selectedFromDate': function(value) {
      this.reportCanGenerate = !!value;
    },

    'selectedUser': function(value) {
      let self = this;
      this.reportCanGenerate = !!value;
      if (value) {
        this.selectedUser = value;
      } else {
        self.selectedUser = user;
      }
    },
  },
  methods: {
    setActiveJob: function(job) {
      this.active_job = job;
      this.active_job_done = "";
    },
    cleanSelectedDates() {
      this.selectedFromDate = null;
      this.selectedToDate = null;
    },
    cleanReport: function(cleanSelected = true) {
      console.log("cleanReport");

      if (cleanSelected) {
        this.cleanSelectedDates();
        this.cleanSelectedUser();
        this.reportCanGenerate = false;
      }

      this.tasks = [];
      this.taskIds = [];
      this.deals = [];
      this.dealIds = [];
      this.groups = [];
      this.groupIds = [];
      this.elapsedItems = [];
      this.elapsedItemIds = [];

      this.reportExists = false;
      this.setActiveJob("");
    },

    startLoading: function() {
      this.reportIsLoading = true;
    },
    stopLoading: function() {
      this.reportIsLoading = false;
    },

    showError: function(error) {
      this.stopLoading();
      Vue.swal.fire({
        position: 'top',
        type: 'error',
        title: 'Oops...',
        text: error
      })
    },

    generateReport() {
      console.log("generateReport");
      let self = this;

      // Empty last report data
      self.cleanReport(false);

      self.userForReport = self.selectedUser;

      self.startLoading();

      self.loadElapsedItems().then(r => {

        self.stopLoading();


      }).catch(error => self.showError(error));
    },


    getGroupForElapsedItem(taskId) {
      console.log('getGroupForElapsedItem task = ', taskId);
      let self = this;

      let task = self.getTaskById(taskId);
      console.log('task.GROUP_ID', task.GROUP_ID);

      return self.getGroupNameById(task.GROUP_ID);

    },

    loadElapsedItems() {
      let self = this;
      return new Promise(function(resolve, reject) {
        self.setActiveJob("Loading Elapsed Items");
        bitrixHelper.findElapsedItemsByDatesAndUser(
          self.selectedFromDate,
          self.selectedToDate,
          self.userForReport.ID
        ).then(items => {
            self.elapsedItems = items;
            self.elapsedItemIds = _.map(items, item => item.ID);
            self.loadTasks().then(resolve);
        }).catch(error => reject(error));
      });
    },

    loadTasks() {
      let self = this;
      return new Promise(function(resolve, reject) {
        self.setActiveJob("Loading Tasks");
        bitrixHelper.findTasksByElapsedItems(
          self.elapsedItems
        ).then(tasks => {
          self.tasks = tasks;
          self.taskIds = _.map(tasks, task => {
            task[cfg.DEAL_ID] = bitrix.GetTaskDealId(task);
            return task.ID;
          });
          self.loadDeals().then(resolve);
        }).catch(error => reject(error));
      });
    },

    loadDeals() {
      let self = this;
      return new Promise(function(resolve, reject) {
        self.setActiveJob("Loading Deals");
        bitrixHelper.findDealsByTasks(
          self.tasks
        ).then(deals => {
          self.deals = deals;
          self.dealIds = _.map(deals, deal => deal.ID);
          self.loadGroups().then(resolve);
        }).catch(error => reject(error));
      });
    },

    loadGroups() {
      let self = this;
      return new Promise(function(resolve, reject) {
        self.setActiveJob("Loading Groups");
        bitrixHelper.findGroupsByTasks(
          self.tasks
        ).then(groups => {
          self.groups = groups;
          resolve();
        }).catch(error => reject(error));
      });
    },

    cleanSelectedUser() {
      this.selectedUser = this.user;
      this.userForReport = this.user;
    },


    setReport(report) {
      this.reportExists = !!report;

      this.report.total = report.total;
      this.report.billed = report.billed;
      this.report.admin = report.admin;
      this.report.marketing = report.marketing;
      this.report.proBono = report.proBono;
      this.report.unmarked = report.unmarked;
      this.report.hMonth85 = report.hMonth85;
      this.report.hMonth100 = report.hMonth100;
      this.report.period = report.period;
      this.report.rows = report.rows;

      console.log("report", this.report);
    },

    exportReport() {
      tableToExcel(["excel-table"], "report", "report.xls");
    }
  }
};

</script>

<style>
body {
  background: none;
}

.additional {
  display: none;
}

.clickable {
  cursor: pointer;
}

.filter-field-buttons input[type="button"] {
  height: 25px;
  padding: 0 18px;
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
  font: bold 13px/25px "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #555;
  text-shadow: #fff 0 1px 1px !important;
  cursor: pointer;
  outline: 0;
  overflow: visible;
  background: url(/bitrix/templates/bitrix24/images/interface/buttons-sprite.png)
    repeat-x left -217px;
}

.filter-field-buttons input[type="button"]:active {
  border-color: #8c939e #9fa7b0 #c8d1d5;
  background-position: left -283px;
}

.filter-field-buttons input[type="button"]:hover {
  background-position: left -250px;
}

input:disabled,
select:disabled,
button:disabled {
  opacity: 0.5;
}

#workarea-content {
  overflow: auto;
  margin-right: 280px;
}

#sidebar {
  position: fixed;
  right: 0;
  z-index: 1;
}

.vue-alert {
  margin-top: 10px;
}

input.btn-apply, input.btn-clean {
  width: 122px;
}

input.btn-export {
  width: 248px;
  margin-top: 5px;
}

.filter-field-buttons  {
  margin-top: 15px;
  margin-bottom: 15px;
}

.sidebar-block-inner form {
  margin-bottom: 20px;
}

.progress-info {
  position: absolute;
  top: 45%;
  left: 40%;
}
</style>
