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
          v-bind:user="user"
          v-bind:selectedFromDate="selectedFromDate"
          v-bind:selectedToDate="selectedToDate"
          v-on:update:report="setReport"
        />
        <ExcelTable
          v-bind:report="report"
          v-bind:user="user"
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
      ReportTable,
      ExcelTable,
  },
  data() {
    return {
      user: null,

      selectedFromDate: null,
      selectedToDate: null,

      additional: false,

      reportExists: false,
      reportCanGenerate: false,
      reportIsLoading: false,

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
        unmarket: 0,
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
      console.log('curentUserId', self.user.ID);
    });
  },
  watch: {
    'selectedFromDate': function(value) {
      this.reportCanGenerate = !!value;
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

      self.startLoading();

      self.loadElapsedItems().then(r => {

        self.stopLoading();


      }).catch(error => self.showError(error));
    },

    // calcTimeForReport: function() {

    //     let self = this;

    //     console.log('CALC TIME FOR REPORT');
    //     console.log('elapsedItems', this.elapsedItems);
    //     console.log('tasks', this.tasks);
    //     console.log('taskIds', this.taskIds);

    //     let total = 0;
    //     let admin = 0;
    //     let billed = 0;
    //     let marketing = 0;
    //     let proBono = 0;
    //     let unmarket = 0;

    //     _.each(self.elapsedItems, item => {
    //       total += Number(item.MINUTES);

    //       if (_.indexOf(self.taskIds, item.TASK_ID) != -1) {

    //         let task = self.getTaskById(item.TASK_ID);

    //         let itemGroupName = self.getGroupNameById(task.GROUP_ID);

    //         if (itemGroupName) {
    //           switch (cfg.GROUPS[itemGroupName]) {
    //             case 'Billed':
    //               if (task.DEAL_ID) {
    //                 billed += Number(item.MINUTES);
    //               } else {
    //                 unmarket += Number(item.MINUTES);
    //               }
    //               break;
    //             case 'Pro bono':
    //               proBono += Number(item.MINUTES);
    //               break;
    //             case 'Marketing':
    //               marketing += Number(item.MINUTES);
    //               break;
    //             case 'Admin':
    //               admin += Number(item.MINUTES);
    //               break;
    //           }
    //         } else {
    //           unmarket += Number(item.MINUTES);
    //         }


    //       }

    //     });

    //     console.log('total', total);
    //     console.log('billed', billed);
    //     console.log('admin', admin);
    //     console.log('proBono', proBono);
    //     console.log('marketing', marketing);
    //     console.log('unmarket', unmarket);

    //     return 43;
    //   },

    // getTaskById(taskId) {
    //   let self = this;
    //   let  index = _.findIndex(self.tasks, task => {
    //    return task.ID == taskId;
    //   });

    //   return self.tasks[index];
    // },

    // getGroupNameById(GroupId) {
    //   let self = this;

    //   if (GroupId != 0) {
    //     let index = _.findIndex(self.groups, group => {
    //      return group.ID == GroupId;
    //     });
    //     return self.groups[index].NAME;
    //   } else {
    //     return null;
    //   }
    // },


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
          self.user.ID
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
         // LoadGroups self.loadCompanies().then(resolve);
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
          // _.map(groups, group => {
          //   self.groupIds[group[SUBJECT_NAME]] = group[ID];
          // });
          resolve();
        }).catch(error => reject(error));
      });
    },


    setReport(report) {
      // TODO: make used union
      this.report.total = report.total;
      this.report.billed = report.billed;
      this.report.admin = report.admin;
      this.report.marketing = report.marketing;
      this.report.proBono = report.proBono;
      this.report.unmarket = report.unmarket;
      this.report.hMonth85 = report.hMonth85;
      this.report.hMonth100 = report.hMonth100;
      this.report.period = report.period;
      this.report.rows = report.rows;

      this.reportExists = !!report;
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
