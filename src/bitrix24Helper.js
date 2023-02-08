import * as cfg from './config.js';
import * as bitrix from './bitrix24.js';
var moment = require("moment");

export function getDealUrl(id) {
  return `${cfg.SITE}/crm/deal/details/${id}/`;
};

export function getTaskUrl(id, user) {
  let self = this;
  return `${cfg.SITE}/company/personal/user/${user}/tasks/task/view/${id}/`;
};

export function findElapsedItemsForTasks(tasks, from, to) {
    console.log("findElapsedItemsForTasks", tasks, from, to);

    return new Promise(function(resolve, reject) {
        if (_.size(tasks) == 0) return resolve([]);

        let filter = {};

        if (to) {
            filter["<=CREATED_DATE"] = moment(to).add(1, "days").format();
        }
        if (from) {
            filter[">=CREATED_DATE"] = from;
        }

        let batchCmd = _.map(tasks, task => {
            return {
                TASKID: task,
                ORDER: {
                    CREATED_DATE: "asc"
                },
                FILTER: filter
            }
        });

        bitrix.BatchElapsedItem(batchCmd).then(items => {
            resolve(items);
        }).catch(error => reject(error));
    });
}

export function findElapsedItemsByDatesAndUser(from, to, id) {
    console.log("findElapsedItemsByDates", from, to);

    return new Promise(function(resolve, reject) {
        let filter = {};

        if (!!from) {
            filter[">=CREATED_DATE"] = moment(from).startOf('day').format();
        }
        if (!!to) {
            filter["<=CREATED_DATE"] = moment(to).endOf('day').format();
        }
        if (!!id) {
            filter["USER_ID"] = id;
        }

        bitrix.GetElapsedItems(
            { ID: "desc" },
            filter,
            ["*"],
            null,
            true
        ).then(items => {
            resolve(items);
        }).catch(error => reject(error));
    });
}

export function findTasksByElapsedItems(items) {
    console.log("findTasksByElapsedItems", items);

    return new Promise(function(resolve, reject) {
        if (_.size(items) == 0) return resolve([]);

        let tasks = _.map(items, item => item.TASK_ID);
        tasks = _.filter(tasks, id => !!id);

        if (_.size(tasks) == 0) return resolve([]);

        tasks = _.uniq(tasks);

        bitrix.GetTasks(
            { ID: "desc" },
            { ID: tasks },
            ["*", "UF_*"],
            null,
            true
        ).then(items => {
            resolve(items);
        }).catch(error => reject(error));
    });
}

export function findDealsByTasks(tasks) {
    console.log("findDealsByTasks", tasks);

    return new Promise(function(resolve, reject) {
        if (_.size(tasks) == 0) return resolve([]);

        let deals = _.map(tasks, task => bitrix.GetTaskDealId(task));
        deals = _.filter(deals, id => !!id);

        if (_.size(deals) == 0) return resolve([]);

        deals = _.uniq(deals);

        bitrix.GetDeals(
            { ID: "desc" },
            { ID: deals },
            ["*", "UF_*"],
            null,
            true
        ).then(items => {
            console.log("deals", items);
            resolve(items);
        }).catch(error => reject(error));
    });
}

export function findGroupsByTasks(tasks) {
  console.log("findGroupsByTasks", tasks);

  return new Promise(function(resolve, reject) {
      if (_.size(tasks) == 0) return resolve([]);

      let groupIds = _.map(tasks, task => task.GROUP_ID);
      groupIds = _.filter(groupIds, id => !!id);

      if (_.size(groupIds) == 0) return resolve([]);

      groupIds = _.uniq(groupIds);

      console.log('groupsIds', groupIds)

      bitrix.GetGroups(
          { 'ID': 'desc' },
          { 'ID': groupIds}
      ).then(items => {
          console.log("groups", items);
          resolve(items);
      }).catch(error => reject(error));
  });
}

export function findCompaniesByDeals(deals) {
    console.log("findCompaniesByDeals", deals);

    return new Promise(function(resolve, reject) {
        if (_.size(deals) == 0) return resolve([]);

        let companies = _.map(deals, deal => deal.COMPANY_ID);
        companies = _.filter(companies, id => !!id);

        if (_.size(companies) == 0) return resolve([]);

        companies = _.uniq(companies);

        bitrix.GetCompanies(
            { ID: "desc" },
            { ID: companies },
            ["*", "UF_*"],
            null,
            true
        ).then(items => {
            resolve(items);
        }).catch(error => reject(error));
    });
}

export function findContactsByDeals(deals) {
    console.log("findContactsByDeals", deals);

    return new Promise(function(resolve, reject) {
        if (_.size(deals) == 0) return resolve([]);

        let contacts = _.map(deals, deal => deal.CONTACT_ID);
        contacts = _.filter(contacts, id => !!id);

        if (_.size(contacts) == 0) return resolve([]);

        contacts = _.uniq(contacts);

        bitrix.GetClients(
            { ID: "desc" },
            { ID: contacts },
            ["*", "UF_*"],
            null,
            true
        ).then(items => {
            resolve(items);
        }).catch(error => reject(error));
    });
}

export function findUsersForElapsedItems(elapsedItems) {
  console.log("findUsersForElapsedItems", elapsedItems);

  return new Promise(function(resolve, reject) {
    if (_.size(elapsedItems) == 0) return resolve([]);

    let userIds = _.map(elapsedItems, elapsedItem => elapsedItem.USER_ID);
    userIds = _.filter(userIds, id => !!id);

    if (_.size(userIds) == 0) return resolve([]);

    userIds = _.uniq(userIds);

    let batchCmd = _.map(userIds, id => {
      return {
        ID: id
      }
    });

    bitrix.BatchUser(batchCmd).then(users => {
      resolve(users);
    }).catch(error => reject(error));
  });
}

export function findUsers(filter) {
  return new Promise(function(resolve, reject) {
    return bitrix.GetUsers(
      { ID: "ASC" },
      filter,
      ["ID","LAST_NAME","NAME","SECOND_NAME"]
    ).then(users => {
      console.log("users", users);
      resolve(users);
    }).catch(error => reject(error));
  });
}

export function findTasksForDeals(deals) {
  console.log("findTasksForDeals", deals);

  return new Promise(function(resolve, reject) {
    if (_.size(deals) == 0) return resolve([]);

    //* As we can't filter tasks by deal id, we:
    //* try to optimaze tasks request by filter them by date
    //* task should be created after deal created and before deal closed.
    //* For sure we make 2 days shift (fuuuuuuuuck... change to 3 months).

    let filter = {};

    let dealsCreateDate = _.map(deals, deal => deal.DATE_CREATE);
    dealsCreateDate = _.filter(dealsCreateDate, date => moment(date).isValid());
    dealsCreateDate = _.map(dealsCreateDate, date => moment(date));
    let createDate = _.min(dealsCreateDate);
    if (createDate) {
      createDate = createDate.subtract(3, "months");
      filter['>=CREATED_DATE'] = createDate.format();
    }

    bitrix.GetTasks(
      { ID: "desc" },
      filter,
      ["ID", "TITLE", "UF_*"],
      null,
      true
    ).then(function(tasks) {
      let filteredTasks = _.filter(tasks, task => {
        let dealId = bitrix.GetTaskDealId(task);
        task['DEAL_ID'] = dealId;
        return _.indexOf(self.dealIds, dealId) != -1;
      });
      resolve(filteredTasks);
    }).catch(error => reject(error));
  });
}

export function findDealsByResponsibles(responsibleIds) {
  console.log("findDealsByResponsibles", responsibleIds);

  return new Promise(function(resolve, reject) {
    if (_.size(responsibleIds) == 0) return resolve([]);

    let companyDealsPromise = findDealsByResponsiblesCompany(responsibleIds);
    let contactDealsPromise = findDealsByResponsiblesContact(responsibleIds);

    Promise.all([companyDealsPromise, contactDealsPromise]).then(dealPacks => {
      resolve(_.flatten(dealPacks));
    }).catch(error => reject(error));
  });
}

export function findDealsByResponsiblesCompany(responsibleIds) {
  console.log("findDealsByResponsiblesCompany", responsibleIds);

  return new Promise(function(resolve, reject) {
    if (_.size(responsibleIds) == 0) return resolve([]);

    let companiesPromise = findResponsiblesCompanies(responsibleIds);

    companiesPromise.then(companies => {
      let companyIds = _.map(companies, company => company.ID);

      self.findDealsByCompanies(companyIds).then(deals => {
        resolve(deals);
      }).catch(error => reject(error));
    }).catch(error => reject(error));
  });
}

export function findDealsByResponsiblesContact(responsibleIds) {
  console.log("findDealsByResponsiblesContact", responsibleIds);

  return new Promise(function(resolve, reject) {
    if (_.size(responsibleIds) == 0) return resolve([]);

    let contactsPromise = findResponsiblesContacts(responsibleIds);
    contactsPromise.then(contacts => {
      let contactIds = _.map(contacts, contact => contact.ID);

      self.findDealsByContactacts(contactIds).then(deals => {
        resolve(deals);
      }).catch(error => reject(error));
    }).catch(error => reject(error));
  });
}

export function findResponsiblesByCompaniesOrContacts(companiesContacts) {
    console.log("findResponsiblesByCompaniesOrContacts", companiesContacts);

    return new Promise(function(resolve, reject) {
        if (_.size(companiesContacts) == 0) return resolve([]);

        let responsibles = _.map(companiesContacts, c => c.ASSIGNED_BY_ID);
        responsibles = _.filter(responsibles, id => !!id);
        if (_.size(responsibles) == 0) return resolve([]);

        responsibles = _.uniq(responsibles);

        return bitrix.GetUsers(
            { ID: "ASC" },
            { ID: responsibles },
            ["*"],
            null,
            true
        ).then(users => {
            resolve(users);
        }).catch(error => reject(error));
    });
}

export function findResponsiblesCompanies(responsibleIds) {
  console.log("findResponsiblesCompanies", responsibleIds);

  if (_.size(responsibleIds) == 0)
    return Promise.resolve([]);

  return bitrix.GetCompanies(
    { ID: "ASC" },
    { ASSIGNED_BY_ID: responsibleIds },
    ["*"],
    null,
    true
  );
}

export function findResponsiblesContacts(responsibleIds) {
  console.log("findResponsiblesContacts", responsibleIds);

  if (_.size(responsibleIds) == 0)
    return Promise.resolve([]);

  return bitrix.GetClients(
    { ID: "ASC" },
    { ASSIGNED_BY_ID: responsibleIds },
    ["*"],
    null,
    true
  );
}

export function findDealsByCompanies(companyIds) {
  console.log("findDealsByCompanies", companyIds);

  if (_.size(companyIds) == 0)
    return Promise.resolve([]);

  return bitrix.GetDeals(
    { STAGE_ID: "ASC" },
    { COMPANY_ID: companyIds },
    ["*"],
    null,
    true
  );
}

export function findDealsByContactacts(contactIds) {
  console.log("findDealsByContactacts", contactIds);

  if (_.size(contactIds) == 0)
    return Promise.resolve([]);

  return bitrix.GetDeals(
    { STAGE_ID: "ASC" },
    { CONTACT_ID: contactIds },
    ["*"],
    null,
    true
  );
}
