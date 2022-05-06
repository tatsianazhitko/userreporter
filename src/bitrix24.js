function partition(array, n) {
  return array.length ? [array.splice(0, n)].concat(partition(array, n)) : [];
}

function ApiBatch(api, params, uniqBy = null) {
  let itemsSize = _.size(params);

  if (itemsSize == 0) {
    return new Promise(function(resolve, reject) {
      reject("No entries found");
    });
  }

  let itemsPack = partition(params, 50);

  let promises = _.map(itemsPack, packParams => {
    return new Promise(function(resolve, reject) {
      let batchCmd = _.map(packParams, function(param) {
        return [api, param];
      });

      BX24.callBatch(batchCmd, function(items) {
        console.log("ApiBatch", items);
        let data = [];
        _.each(items, item => {
          if (!!item.answer.error) reject(item.answer.error.error_description);
          data = data.concat(item.answer.result);
        });
        if (uniqBy) data = _.uniqBy(data, item => item[uniqBy]);
        data = _.filter(data, d => !_.isEmpty(d));
        resolve(data);
      });
    });
  });

  return new Promise(function(resolve, reject) {
    Promise.all(promises).then(values => {
      resolve(_.union(...values));
    }).catch(error => reject(error));
  });

}

function ApiList(api, order, filter, select, params, more) {
  return new Promise(function(resolve, reject) {
    let data = [];
    let total = 0;
    if (!order) order = { ID: "desc" };
    if (!filter) order = {};
    if (!select) order = "*";
    BX24.callMethod(
      api,
      {
        order: order,
        filter: filter,
        params: params,
        select: select
      },
      function(result) {
        if (result.error()) {
          reject(result.error());
        } else {
          if (!!result.answer.total) total = result.answer.total;

          data = data.concat(result.data());

          document.getElementsByClassName("progress-info-done")[0].innerHTML= Math.round(data.length / total * 100);

          if (!result.answer.next && total > data.length)
          {
            result.answer.next = data.length;
          }

          if (more && result.more()) {
            result.next();
          } else {
            resolve(data);
          }
        }
      }
    );
  });
}

function ApiGet(api, id) {
  return new Promise(function(resolve, reject) {
    BX24.callMethod(api, { id: id }, function(result) {
      if (result.error()) {
        reject(result.error());
      } else {
        resolve(result.data());
      }
    });
  });
}

function ApiUpdate(api, id, data) {
  return new Promise(function(resolve, reject) {
    BX24.callMethod(api, [id, data], function(result) {
      if (result.error()) {
        reject(result.error());
      } else {
        resolve(result.data());
      }
    });
  });
}

export function Profile() {
  return new Promise(function(resolve, reject) {
    BX24.callMethod("profile", {}, function(result) {
      if (result.error()) {
        reject(result.error());
      } else {
        resolve(result.data());
      }
    });
  });
}

export function UserCurrent() {
  return new Promise(function(resolve, reject) {
    BX24.callMethod("user.current", {}, function(result) {
      if (result.error()) {
        reject(result.error());
      } else {
        resolve(result.data());
      }
    });
  });
}

export function GetUser(id) {
  return ApiGet("user.get", id);
}

export function GetUsers(order, filter, select, params, more = false) {
  return ApiList("user.get", order, filter, select, more);
}

export function BatchUsers(params) {
  return ApiBatch("user.search", params, "ID");
}

export function BatchUser(params) {
  return ApiBatch("user.get", params, "ID");
}

export function GetDeals(order, filter, select, params, more = false) {
  if (!params)
    params = {
      NAV_PARAMS: {
        nPageSize: 50
      }
    };
  return ApiList("crm.deal.list", order, filter, select, params, more);
}

export function GetDeal(id) {
  return ApiGet("crm.deal.get", id);
}

export function GetClients(order, filter, select, params, more = false) {
  if (!params)
    params = {
      NAV_PARAMS: {
        nPageSize: 50
      }
    };
  return ApiList("crm.contact.list", order, filter, select, params, more);
}

export function GetClient(id) {
  return ApiGet("crm.contact.get", id);
}

export function BatchClients(params) {
  return ApiBatch("crm.contact.list", params, "ID");
}

export function GetCompanies(order, filter, select, params, more = false) {
  if (!params)
    params = {
      NAV_PARAMS: {
        nPageSize: 50
      }
    };
  return ApiList("crm.company.list", order, filter, select, params, more);
}

export function GetCompany(id) {
  return ApiGet("crm.company.get", id);
}

export function GetTasks(order, filter, select, params, more = false) {
  if (!params)
    params = {
      NAV_PARAMS: {
        nPageSize: 50
      }
    };
  return ApiList("task.item.list", order, filter, select, params, more);
}

export function GetGroups(order, filter) {
  return new Promise(function(resolve, reject) {
    BX24.callMethod('sonet_group.get', {
      'ORDER': order,
      'FILTER': filter
    }, function(result) {
      if (result.error()) {
        reject(result.error());
      } else {
        resolve(result.data());
      }
    });
  });
}

export function GetTask(id) {
  return ApiGet("task.item.getdata", id);
}

export function UpdateTask(id, data) {
  return ApiUpdate("task.item.update", id, data);
}

export function BatchUpdateTask(ids, data) {
  let params = _.map(ids, id => {
    return [id, data];
  });
  return ApiBatch("task.item.update", params);
}

export function GetUserFullName(user) {
  return [user.LAST_NAME || "", user.NAME || "", user.SECOND_NAME || ""].join(
    " "
  );
}

export function GetTaskDealId(task) {
  let ids = _.get(task, "UF_CRM_TASK", []);
  let dealId = _.find(ids, id => _.startsWith(id, "D_"));
  if (!dealId) return undefined;
  dealId = _.replace(dealId, "D_", "");
  return dealId;
}

export function GetElapsedItems(order, filter, select, params, more = false) {
  if (!params)
    params = {
      NAV_PARAMS: {
        nPageSize: 50,
        iNumPage: 1
      }
    };
  return new Promise(function(resolve, reject) {
    let data = [];
    let total = 0;
    if (!order) order = { ID: "desc" };
    if (!filter) order = {};
    if (!select) order = "*";
    BX24.callMethod(
      "task.elapseditem.getlist",
      [
        order,
        filter,
        select,
        params
      ],
      function(result) {
        if (result.error()) {
          reject(result.error());
        } else {
          data = data.concat(result.data());

          if (!!result.answer.total) total = result.answer.total;
          document.getElementsByClassName("progress-info-done")[0].innerHTML= Math.round(data.length / total * 100);

          if (more && result.more()) {
            // Fucking bitrix bug
            result.query.data[3].NAV_PARAMS.iNumPage++;
            result.next();
          } else {
            resolve(data);
          }
        }
      }
    );
  });
}

export function BatchElapsedItem(params) {
  return ApiBatch("task.elapseditem.getlist", params, "ID");
}

export function fitWindow(additionalWidth, additionalHeight) {
  let size = BX24.getScrollSize();
  BX24.resizeWindow(
    size.scrollWidth + additionalWidth,
    size.scrollHeight + additionalHeight
  );
}
