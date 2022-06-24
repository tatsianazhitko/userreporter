<template>
    <div>
        <div class="filter-field">
          <label class="filter-field-title">User</label>
            <Autocomplete
              :items="filter_user_items"
              @update-items="updateUserItems"
              @focus="updateUserItems"
              @input="selectUserItem"
              :min-len=0
              :component-item='filter_items_template'
              :get-label="getFIO"
              :value="value"
            ></Autocomplete>
          </div>
    </div>
</template>

<script>
var _ = require("lodash");
import * as bitrix from './bitrix24.js';
import Autocomplete from "v-autocomplete";
import ItemTemplate from './ItemTemplate.vue';

import * as u from './utils';

export default {
    components: {
        Autocomplete
    },
    props: [],
    watch: {
        // TODO: filter by responsibles
        // 'responsibles': function(value) {
        //     this.contact = null;
        // },
    },
    data() {
        return {
            items: [],
            template: ItemTemplate
        }
    },
    methods: {
        getFIO: u.getFIO,
        updateUserItems(query) {
          let self = this;

          let filter = {};

          if (query.trim().length !== 0) {
            filter['NAME_SEARCH'] = query;
          }

          //self.setActiveJob("Loading Users");
          return bitrix.GetUsers(
            { ID: "ASC" },
            filter,
            ["ID","LAST_NAME","NAME","SECOND_NAME"]
          ).then(users => {
            self.filter_user_items = users;
          });
        },
        selectItem(item) {
            if (item && item.ID === this.contact) return;

            this.$emit("input", item);
        },

        selectUserItem(user) {
      if (user && user.ID === this.$data.selected_user) return;
      if (user)
        this.$data.selected_user = user.ID;
      else
        this.$data.selected_user = -1;
    },
  }
}
</script>

<style>
.v-autocomplete .v-autocomplete-input-group .v-autocomplete-input {
	padding: 4px;
	box-shadow: none;
	border: 1px solid #ccc;
    width: 250px;
    height: 32px;
	outline: none;
	background-color: #fff;
}

input.v-autocomplete-input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    background-image: url(data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%207.3%207.3%22%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22m%204.25%2C3.61%202.84%2C-2.84%20c%200.17%2C-0.17%200.17%2C-0.46%200%2C-0.63%20-0.17%2C-0.17%20-0.46%2C-0.17%20-0.63%2C0%20l%20-2.84%2C2.84%20-2.84%2C-2.84%20c%20-0.17%20-0.17%20-0.46%2C-0.17%20-0.63%2C0%20-0.17%2C0.17%20-0.17%2C0.46%200%2C0.63%20l%202.84%2C2.84%20-2.84%2C2.84%20c%20-0.17%2C0.17%20-0.17%2C0.46%200%2C0.63%200.17%2C0.17%200.45%2C0.17%200.63%2C0%20l%202.84%2C-2.84%202.84%2C2.84%20c%200.17%2C0.17%200.45%2C0.17%200.63%2C0%200.17%2C-0.17%200.17%2C-0.46%200%2C-0.63%20z%22%2F%3E%3C%2Fsvg%3E);
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

.v-autocomplete .v-autocomplete-input-group.v-autocomplete-selected .v-autocomplete-input {
	color: #fff;
	background-color: #5C6BC0;
}

.v-autocomplete .v-autocomplete-list {
	width: 250px;
	text-align: left;
	border: none;
	border-top: none;
	max-height: 200px;
	overflow-y: auto;
    border-bottom: 1px solid #ccc;
    z-index: 2;
}

.v-autocomplete .v-autocomplete-list .v-autocomplete-list-item {
	cursor: pointer;
	background-color: #fff;
	padding: 4px;
	border-left: 1px solid #ccc;
	border-right: 1px solid #ccc;
}

.v-autocomplete .v-autocomplete-list .v-autocomplete-list-item:hover {
    background-color: #5C6BC0;
    color: #fff;
}
</style>
