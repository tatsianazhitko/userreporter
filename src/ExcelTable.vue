<template>
  <div>
    <Table id="excel-table">
			        <Column ss:Width="95"/>
              <Column ss:Width="95"/>
              <Column ss:Width="180"/>
              <Column ss:Width="95"/>
              <Column ss:Width="45"/>
              <Row>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Personal Work Reporter</Data>
                </Cell>
              </Row>
              <Row></Row>
              <Row>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Name</Data>
                </Cell>
                <Cell ss:StyleID="Normal"  ss:MergeAcross="3" >
                  <Data ss:Type="String">{{getFIO(user)}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Position</Data>
                </Cell>
                <Cell ss:StyleID="Normal" ss:MergeAcross="3" >
                  <Data ss:Type="String">{{user.WORK_POSITION}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Period</Data>
                </Cell>
                <Cell ss:StyleID="Normal" ss:MergeAcross="3" >
                  <Data ss:Type="String">{{report.period}}</Data>
                </Cell>
              </Row>
              <Row></Row>
              <Row>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Time</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">Total</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.total}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">Billed</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.billed}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">Admin</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.admin}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">Marketing</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.marketing}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">Pro Bono</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.proBono}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">Unmarked</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.unmarked}}</Data>
                </Cell>
              </Row>
              <Row></Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">% 85h/month</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.hMonth85}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="String">% 100h/month</Data>
                </Cell>
                <Cell ss:StyleID="Normal">
                  <Data ss:Type="Number">{{report.hMonth100}}</Data>
                </Cell>
              </Row>
              <Row></Row>
              <Row>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Date</Data>
                </Cell>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Deal</Data>
                </Cell>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Task</Data>
                </Cell>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Comment</Data>
                </Cell>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="String">Time</Data>
                </Cell>
              </Row>
              <Row :ss:Height="row.type==='header' ? '30' : undefined" v-for="(row, i) in report.rows">
                <Cell ss:StyleID="Title" v-if="row.type==='header'">
                  <Data ss:Type="String">Project:</Data>
                </Cell>
                <Cell ss:StyleID="Title" ss:MergeAcross="3" v-if="row.type==='header'">
                  <Data ss:Type="String">{{row.title}}</Data>
                </Cell>

                <Cell ss:StyleID="Normal" v-if="row.type==='item'">
                  <Data ss:Type="String">{{row.date}}</Data>
                </Cell>
                <Cell ss:StyleID="Normal" v-if="row.type==='item'">
                  <Data ss:Type="String" v-if="row.deal != undefined">{{row.deal.TITLE}}</Data>
                </Cell>
                <Cell ss:StyleID="Normal" v-if="row.type==='item'">
                  <Data ss:Type="String">{{row.task}}</Data>
                </Cell>
                <Cell ss:StyleID="Normal" v-if="row.type==='item'">
                  <Data ss:Type="String" v-if="!row.invoiced_tc || !show_invoiced_comment">{{row.comment}}</Data>
                </Cell>
                <Cell ss:StyleID="Normal" v-if="row.type==='item'">
                  <Data ss:Type="Number">{{row.time}}</Data>
                </Cell>

                <Cell ss:StyleID="Title" ss:MergeAcross="3" v-if="row.type==='footer'">
                  <Data ss:Type="String">Subtotal:</Data>
                </Cell>
                <Cell ss:StyleID="Title" v-if="row.type==='footer'">
                  <Data ss:Type="Number">{{row.total}}</Data>
                </Cell>
              </Row>
              <Row>
                <Cell ss:StyleID="Title" ss:MergeAcross="3">
                  <Data ss:Type="String">Total:</Data>
                </Cell>
                <Cell ss:StyleID="Title">
                  <Data ss:Type="Number">{{report.total}}</Data>
                </Cell>
              </Row>
            </Table>
  </div>
</template>

<script>
import * as u from "./utils";
import * as cfg from "./config.js";
var _ = require("lodash");

export default {
  props: [
    "report",
    "user"
  ],
  methods: {
    getFIO(user) {
      return u.getFIO(user);
    },

    getFIO: u.getFIO,
    getRate: function (user) {
      if (!user.WORK_POSITION) return 0;
      const workPosition = _.trim(user.WORK_POSITION.toLowerCase());
      return _.get(cfg.CURRENT_RATE, workPosition, 0);
    },

    getReportRateFormula: function (user, ir) {
      return `=R[${-8 - _.size(this.users)}]C * RC[${-2 - ir}]`;
    },
    getResponsiblesFormula: function () {
      return `=SUM(R[${_.size(this.users)}]C:R[1]C)`;
    },
    getUserFormula: function () {
      return `=SUM(R[0]C[${_.size(this.responsibles)}]:R[0]C[1])`;
    },

    getResponsiblesRateTotalFormula: function () {
      return `=SUM(R[${_.size(this.users) + 4}]C:R[5]C)`;
    },
    getResponsiblesRateOwnFormula: function (r, ir) {
      return `=SUMIF(R[${_.size(this.users) + 1}]C[${-4 - ir}]:R[2]C[${
        -4 - ir
      }],${r.ID},R[${_.size(this.users) + 1}]C:R[2]C)`;
    },
    getResponsiblesRateNonOwnFormula: function (r, ir) {
      return `=SUMIF(R[${_.size(this.users)}]C[${-4 - ir}]:R[1]C[${-4 - ir}],${
        r.ID
      },R[${_.size(this.users)}]C[${-1 - ir}]:R[1]C[${-1 - ir}]) - R[-1]C`;
    },
    getResponsiblesRatePartnerFormula: function (r, ir) {
      return `=SUMIF(R[${_.size(this.users) + 2}]C[${-2 - ir}]:R[3]C[${
        -2 - ir
      }],40,R[${_.size(this.users) + 2}]C:R[3]C)`;
    },
    getResponsiblesRateLawyersFormula: function () {
      return `=R[-1]C-R[1]C`;
    },
  },
};
</script>

<style>
#excel-table {
  opacity: 0;
}
</style>
