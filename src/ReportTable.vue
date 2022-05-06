<template>
  <div class="workarea-content-paddings">
    <!-- groups: {{groups}} <br> -->
    <!-- groupIds: {{groupIds}} <br> -->
    <!-- deals: {{deals}} <br> -->
    <!-- dealIds: {{dealIds}} <br> -->
    <!-- tasks: {{tasks}} <br> -->
    <!-- taskIds: {{taskIds}} <br> -->
    <!-- elapsedItems: {{elapsedItems}} <br> -->
    <!-- elapsedItemIds: {{elapsedItemIds}} <br> -->
    <!-- user: {{user}} <br /> -->
    <h1>Personal Work Reporter</h1>
    <h2>{{getFIO(user)}}</h2>
    <h3>{{user.WORK_POSITION}}</h3>
    <span>Period: {{report_period}}</span>

    <table cellspacing="0" class="reports-list-table" id="report-users">
      <thead>
        <th class="reports-first-column reports-head-cell-top"></th>
        <th class="reports-head-cell reports-head-cell-top">Time elapsed</th>
      </thead>
      <tbody>
        <tr>
          <td class="report-row reports-first-column table-cell-bold">Total</td>
          <td class="report-row">{{report.total}}</td>
        </tr>
        <tr>
          <td class="report-row reports-first-column">Admin</td>
          <td class="report-row">{{report.admin}}</td>
        </tr>
        <tr>
          <td class="report-row reports-first-column">Billed</td>
          <td class="report-row">{{report.billed}}</td>
        </tr>
        <tr>
          <td class="report-row reports-first-column">Marketing</td>
          <td class="report-row">{{report.marketing}}</td>
        </tr>
        <tr>
          <td class="report-row reports-first-column">ProBono</td>
          <td class="report-row">{{report.proBono}}</td>
        </tr>
        <tr>
          <td class="report-row reports-first-column">Unmarket</td>
          <td class="report-row">{{report.unmarket}}</td>
        </tr>
        <tr>
          <td class="report-row reports-first-column table-cell-bold">% 85h/month</td>
          <td class="report-row">{{report.hMonth85}}</td>
        </tr>
        <tr class>
          <td class="report-row reports-first-column table-cell-bold">% 100h/month</td>
          <td class="report-row">{{report.hMonth100}}</td>
        </tr>
      </tbody>
    </table>
    <h2>Specification</h2>
    <table cellspacing="0" class="reports-list-table" id="report-spec">
      <thead>
        <th class="reports-first-column reports-head-cell-top">Date</th>
        <th class="reports-head-cell reports-head-cell-top">Deal</th>
        <th class="reports-head-cell reports-head-cell-top">Task</th>
        <th class="reports-head-cell reports-head-cell-top">Comment</th>
        <th class="reports-head-cell reports-head-cell-top">Time elapsed</th>
      </thead>
      <tbody>
        <tr v-for="(row, i) in report.rows" v-bind:key="i" class="reports-list-item">
          <td class="report-deal reports-first-column" v-if="row.type==='header'">Project:</td>
          <td class="report-deal" colspan="4" v-if="row.type==='header'">{{row.title}}</td>
          <td class="report-row reports-first-column" v-if="row.type==='item'">{{row.date}}</td>
          <td class="report-row" v-if="row.type==='item'">
            <a target="_blank" v-if="row.deal != undefined" :href="getDealUrl(row.deal.ID)">{{row.deal.TITLE}}</a>
          </td>
          <td class="report-row" v-if="row.type==='item'">
            <a target="_blank" :href="getTaskUrl(row.task_id)">{{row.task}}</a>
          </td>
          <td class="report-row" v-if="row.type==='item'">{{row.comment}}</td>
          <td class="report-row" v-if="row.type==='item'">{{row.time}}</td>
          <td
            class="report-subtotal reports-first-column"
            colspan="4"
            v-if="row.type==='footer'"
          >Subtotal:</td>
          <td class="report-subtotal" v-if="row.type==='footer'">{{row.total}}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="report-total">
          <td class="reports-first-column reports-head-cell-top"></td>
          <td class="reports-head-cell reports-head-cell-top"></td>
          <td class="reports-head-cell reports-head-cell-top"></td>
          <td class="reports-head-cell reports-head-cell-top">Total:</td>
          <td class="reports-head-cell reports-head-cell-top">{{total}}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
var _ = require("lodash");

import Vue from "vue";
import { VTooltip, VPopover, VClosePopover } from "v-tooltip";

var Decimal = require("decimal.js");
var Hours = Decimal.clone({ rounding: 0 });

import * as u from "./utils";
import * as cfg from "./config.js";
import * as bitrixHelper from "./bitrix24Helper";

export default {
  components: {
    VTooltip,
    VPopover,
    VClosePopover,
  },
  props: [
    "tasks",
    "taskIds",
    "deals",
    "dealIds",
    "groups",
    "groupIds",
    "elapsedItems",
    "elapsedItemIds",
    "user",
    "selectedFromDate",
    "selectedToDate"
  ],
  watch: {
    groups : "buildReport",
  },
  data() {
    return {
      report: {},
      report_period: '',
      total: 0,
      admin: 0,
      billed: 0,
      marketing: 0,
      proBono: 0,
      unmarket: 0,
      hMonth85: 0,
      hMonth100: 0,
      groups_items: {}
    };
  },
  methods: {
    getFIO: u.getFIO,
    buildReport() {
      let self = this;

      let tasksById = _.groupBy(self.tasks, "ID");
      let dealsById = _.groupBy(self.deals, "ID");

      this.report_period = u.getPeriodToString(this.selectedFromDate, this.selectedToDate);

      self.total = new Hours(0);
      self.admin = new Hours(0);
      self.billed = new Hours(0);
      self.marketing = new Hours(0);
      self.proBono = new Hours(0);
      self.unmarket = new Hours(0);

      self.calcDataForReport();
      self.addDataToReport();

      //console.log('report', this.report);

    },

    addDataToReport() {

      this.report.total = this.total;
      this.report.admin = this.admin;
      this.report.billed = this.billed;
      this.report.marketing = this.marketing;
      this.report.proBono = this.proBono;
      this.report.unmarket = this.unmarket;
      this.report.hMonth85 = this.hMonth85;
      this.report.hMonth100 = this.hMonth100;

      this.report.period = this.report_period;

      this.report.rows = [];
      for (let key in this.groups_items) {
        if (this.groups_items[key].length > 0) {
          let subtotal = new Hours(0);
          let rowCount = 0;

          this.report.rows.push({
            type: "header",
            title: key
          });

          _.each(this.groups_items[key], item => {
            console.log("item", item);
            this.report.rows.push({
              type: "item",
              date: u.formatDate(item.CREATED_DATE),
              deal: item.deal,
              task: item.task.TITLE,
              task_id: item.task.ID,
              comment: item.COMMENT_TEXT,
              time: u.convertToHours(item.MINUTES)
            });
            subtotal = subtotal.add(u.convertToHours(item.MINUTES));
            rowCount ++;
          });

          this.report.rows.push({
            type: "footer",
            total: subtotal,
            count: rowCount
          });

        }
      }

      this.$emit("update:report", this.report);
    },

    calcDataForReport() {

        let self = this;

        let billedTasks = [];
        let adminTasks = [];
        let unmarketTasks = [];
        let marketingTasks = [];
        let proBonoTasks = [];


        // console.log('CALC TIME FOR REPORT');
        // console.log('elapsedItems', this.elapsedItems);
        // console.log('tasks', this.tasks);
        // console.log('taskIds', this.taskIds);

        _.each(self.elapsedItems, item => {
          self.total = self.total.add(u.convertToHours(item.MINUTES));

          if (_.indexOf(self.taskIds, item.TASK_ID) != -1) {

            let task = self.getTaskById(item.TASK_ID);
            let deal = self.getDealById(task.DEAL_ID);
            item.task = task;
            item.deal = deal;

            let itemGroupName = self.getGroupNameById(task.GROUP_ID);

            if (itemGroupName) {
              switch (cfg.GROUPS[itemGroupName]) {
                case 'Billed':
                  if (task.DEAL_ID) {
                    self.billed = self.billed.add(u.convertToHours(item.MINUTES));
                    billedTasks.push(item);
                  } else {
                    self.unmarket = self.unmarket.add(u.convertToHours(item.MINUTES));
                    unmarketTasks.push(item);
                  }
                  break;
                case 'Pro bono':
                  self.proBono = self.proBono.add(u.convertToHours(item.MINUTES));
                  proBonoTasks.push(item);
                  break;
                case 'Marketing':
                  self.marketing = self.marketing.add(u.convertToHours(item.MINUTES));
                  marketingTasks.push(item);
                  break;
                case 'Admin':
                  self.admin = self.admin.add(u.convertToHours(item.MINUTES));
                  adminTasks.push(item);
                  break;
              }
            } else {
              self.unmarket = self.unmarket.add(u.convertToHours(item.MINUTES));
              unmarketTasks.push(item);
            }
          }
        });

        self.groups_items = {
          'Tax&Regulatory, Corporate, Dispute Resolution': billedTasks,
          'Administrative': adminTasks,
          'Marketing': marketingTasks,
          'Pro bono': proBonoTasks,
          'Unmarked Time': unmarketTasks
        }

        let numberOfDays = u.numberOfDay(self.selectedFromDate, self.selectedToDate);
        self.hMonth85 = self.billed/((85/29.3)*numberOfDays);
        self.hMonth85 = self.hMonth85.toFixed(cfg.ROUND_CASH_TO);
        self.hMonth100 = self.billed/((100/29.3)*numberOfDays);
        self.hMonth100 = self.hMonth100.toFixed(cfg.ROUND_CASH_TO);

      },

    getTaskById(taskId) {
      let self = this;
      let  index = _.findIndex(self.tasks, task => {
       return task.ID == taskId;
      });

      return self.tasks[index];
    },

    getDealById(dealId) {
      let self = this;
      let  index = _.findIndex(self.deals, deal => {
       return deal.ID == dealId;
      });

      return self.deals[index];
    },

    getGroupNameById(GroupId) {
      let self = this;

      if (GroupId != 0) {
        let index = _.findIndex(self.groups, group => {
         return group.ID == GroupId;
        });
        return self.groups[index].NAME;
      } else {
        return null;
      }
    },

    getFIO(user) {
      return u.getFIO(user);
    },

    getTaskUrl(id) {
      let self = this;
      return `${cfg.SITE}/company/personal/user/${self.user.ID}/tasks/task/view/${id}/`;
    },

    getDealUrl(id) {
      return `${cfg.SITE}/crm/deal/details/${id}/`;
    },

  },
};
</script>

<style>
.report-total {
  font-weight: bold;
}

.reports-first-column {
  width: 20%;
  min-width: 100px;

}

.table-cell-bold {
  font-weight: bold;
}
.report-subtotal {
  font-weight: bold;
  font-style: italic;
}

.report-deal {
  font-style: italic;
  text-decoration: underline;
}

.reports-block-row td {
  border-bottom: 1px solid #58564c;
}

.tooltip {
  display: block !important;
  z-index: 10000;
}

.tooltip .tooltip-inner {
  background: black;
  color: white;
  border-radius: 16px;
  padding: 5px 10px 4px;
  max-height: 300px;
  overflow: auto;
  max-width: 600px;
}

.tooltip .tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: black;
  z-index: 1;
}

.tooltip[x-placement^="top"] {
  margin-bottom: 5px;
}

.tooltip[x-placement^="top"] .tooltip-arrow {
  border-width: 5px 5px 0 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="bottom"] {
  margin-top: 5px;
}

.tooltip[x-placement^="bottom"] .tooltip-arrow {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="right"] {
  margin-left: 5px;
}

.tooltip[x-placement^="right"] .tooltip-arrow {
  border-width: 5px 5px 5px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[x-placement^="left"] {
  margin-right: 5px;
}

.tooltip[x-placement^="left"] .tooltip-arrow {
  border-width: 5px 0 5px 5px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip.popover .popover-inner {
  background: #f9f9f9;
  color: black;
  padding: 24px;
  border-radius: 5px;
  box-shadow: 0 5px 30px rgba(black, 0.1);
}

.tooltip.popover .popover-arrow {
  border-color: #f9f9f9;
}

.tooltip[aria-hidden="true"] {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s, visibility 0.15s;
}

.tooltip[aria-hidden="false"] {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.15s;
}
</style>

