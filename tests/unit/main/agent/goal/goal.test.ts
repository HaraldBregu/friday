import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyGoalCommand } from '../../../../../src/main/agent/goal/apply';
import { createGoal } from '../../../../../src/main/agent/goal/create';
import { parseGoalCommand } from '../../../../../src/main/agent/goal/parse';
import { readGoal } from '../../../../../src/main/agent/goal/read';
import { updateGoalStatus } from '../../../../../src/main/agent/goal/status';

let directory: string;

beforeEach(() => {
	directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-goal-'));
});

afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

it('creates and persists a session goal with a success criterion', () => {
	const goal = createGoal(directory, 'Keep tests green');
	expect(readGoal(directory)).toEqual(goal);
	expect(goal.criteria).toEqual([
		{ id: 'criterion-1', description: 'Keep tests green', satisfied: false, evidenceIds: [] },
	]);
});

it('rejects duplicate and corrupt goals', () => {
	createGoal(directory, 'First');
	expect(() => createGoal(directory, 'Second')).toThrow('already exists');
	fs.writeFileSync(path.join(directory, 'goal.json'), '{}');
	expect(() => readGoal(directory)).toThrow();
});

it('applies lifecycle commands without invoking an agent run', () => {
	applyGoalCommand(directory, parseGoalCommand('/goal Ship it')!);
	expect(readGoal(directory)?.status).toBe('active');
	applyGoalCommand(directory, parseGoalCommand('/goal pause waiting')!);
	expect(readGoal(directory)).toMatchObject({ status: 'paused', statusNote: 'waiting' });
	applyGoalCommand(directory, parseGoalCommand('/goal resume')!);
	expect(readGoal(directory)?.status).toBe('active');
	applyGoalCommand(directory, parseGoalCommand('/goal clear')!);
	expect(readGoal(directory)).toBeUndefined();
});

it('does not resume a completed goal', () => {
	createGoal(directory, 'Done');
	updateGoalStatus(directory, 'completed');
	expect(() => updateGoalStatus(directory, 'active')).toThrow('cannot be resumed');
});
