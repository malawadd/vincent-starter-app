export const api = {
  purchases: {
    listByEthAddress: { _name: 'purchases:listByEthAddress' },
    create: { _name: 'purchases:create' },
  },
  schedules: {
    listByEthAddress: { _name: 'schedules:listByEthAddress' },
    getById: { _name: 'schedules:getById' },
    findByEthAddressAndId: { _name: 'schedules:findByEthAddressAndId' },
    create: { _name: 'schedules:create' },
    update: { _name: 'schedules:update' },
    disable: { _name: 'schedules:disable' },
    enable: { _name: 'schedules:enable' },
    remove: { _name: 'schedules:remove' },
    getDueSchedules: { _name: 'schedules:getDueSchedules' },
    lockSchedule: { _name: 'schedules:lockSchedule' },
    unlockSchedule: { _name: 'schedules:unlockSchedule' },
    updateAfterExecution: { _name: 'schedules:updateAfterExecution' },
  },
};

export const internal = {};
