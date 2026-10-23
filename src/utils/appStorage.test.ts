import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEPARTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUEUE_JOBS,
  INITIAL_TASKS,
  INITIAL_TICKETS,
  INITIAL_USERS,
} from '../data/mockData';
import type { AppData } from './appStorage';
import { loadAppData, saveAppData } from './appStorage';

const DATA_KEY = 'unitask_app_data_v1';

function withWindow(windowValue: unknown, run: () => void): void {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowValue,
  });

  try {
    run();
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  }
}

function createMemoryStorage(initialValues: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialValues));
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    },
  };
}

test('round-trips edited tasks, users, tickets, notifications, and audit records', () => {
  const { storage } = createMemoryStorage();
  const data: AppData = {
    users: [{ ...INITIAL_USERS[0], fullName: 'Edited user' }],
    departments: [],
    tasks: [{ ...INITIAL_TASKS[0], title: 'Edited task' }],
    auditLogs: [{ ...INITIAL_AUDIT_LOGS[0], details: 'Edited audit record' }],
    queueJobs: [],
    notifications: [{ ...INITIAL_NOTIFICATIONS[0], title: 'Edited notification' }],
    tickets: [{ ...INITIAL_TICKETS[0], title: 'Edited ticket' }],
    currentUserId: INITIAL_USERS[0].id,
    language: 'ru',
  };

  withWindow({ localStorage: storage }, () => {
    saveAppData(data);

    const loaded = loadAppData();
    const { storageStatus, canPersist, ...loadedData } = loaded;

    assert.deepEqual(loadedData, data);
    assert.equal(storageStatus, 'saved');
    assert.equal(canPersist, true);
  });
});

test('loads demo records when browser storage is empty', () => {
  const { storage } = createMemoryStorage();

  withWindow({ localStorage: storage }, () => {
    const loaded = loadAppData();

    assert.equal(loaded.storageStatus, 'demo');
    assert.equal(loaded.canPersist, true);
    assert.equal(loaded.currentUserId, INITIAL_USERS[0]?.id ?? null);
    assert.deepEqual(loaded.users, INITIAL_USERS);
    assert.deepEqual(loaded.departments, INITIAL_DEPARTMENTS);
    assert.deepEqual(loaded.tasks, INITIAL_TASKS);
    assert.deepEqual(loaded.auditLogs, INITIAL_AUDIT_LOGS);
    assert.deepEqual(loaded.queueJobs, INITIAL_QUEUE_JOBS);
    assert.deepEqual(loaded.notifications, INITIAL_NOTIFICATIONS);
    assert.deepEqual(loaded.tickets, INITIAL_TICKETS);
  });
});

test('backs up malformed saved JSON and recovers with demo records without throwing', () => {
  const malformedData = '{saved data is not valid JSON';
  const { storage, values } = createMemoryStorage({ [DATA_KEY]: malformedData });

  withWindow({ localStorage: storage }, () => {
    assert.doesNotThrow(() => {
      const loaded = loadAppData();
      assert.equal(loaded.storageStatus, 'recovered');
      assert.equal(loaded.canPersist, true);
      assert.deepEqual(loaded.tasks, INITIAL_TASKS);
    });

    assert.ok([...values.values()].includes(malformedData));
  });
});

test('backs up structurally invalid saved records and recovers with demo records', () => {
  const invalidData = JSON.stringify({
    version: 1,
    users: [],
    departments: [],
    tasks: [{ title: 'Record without an id' }],
    auditLogs: [],
    queueJobs: [],
    notifications: [],
    tickets: [],
    currentUserId: null,
    language: 'en',
  });
  const { storage, values } = createMemoryStorage({ [DATA_KEY]: invalidData });

  withWindow({ localStorage: storage }, () => {
    const loaded = loadAppData();

    assert.equal(loaded.storageStatus, 'recovered');
    assert.equal(loaded.canPersist, true);
    assert.deepEqual(loaded.tasks, INITIAL_TASKS);
    assert.ok([...values.values()].includes(invalidData));
  });
});

test('reports unavailable storage without crashing when a corrupt-data backup cannot be written', () => {
  const malformedData = '{saved data is not valid JSON';

  withWindow({
    localStorage: {
      getItem: () => malformedData,
      setItem: () => {
        throw new Error('Storage quota exceeded');
      },
    },
  }, () => {
    assert.doesNotThrow(() => {
      const loaded = loadAppData();
      assert.equal(loaded.storageStatus, 'unavailable');
      assert.equal(loaded.canPersist, false);
      assert.deepEqual(loaded.tasks, INITIAL_TASKS);
    });
  });
});

test('reports unavailable storage without crashing when the browser has no window', () => {
  withWindow(undefined, () => {
    assert.doesNotThrow(() => {
      const loaded = loadAppData();
      assert.equal(loaded.storageStatus, 'unavailable');
      assert.equal(loaded.canPersist, false);
      assert.deepEqual(loaded.tasks, INITIAL_TASKS);
    });
  });
});

test('reports unavailable storage without crashing when local storage access fails', () => {
  withWindow({
    get localStorage() {
      throw new Error('Storage access denied');
    },
  }, () => {
    assert.doesNotThrow(() => {
      const loaded = loadAppData();
      assert.equal(loaded.storageStatus, 'unavailable');
      assert.equal(loaded.canPersist, false);
    });
  });
});
