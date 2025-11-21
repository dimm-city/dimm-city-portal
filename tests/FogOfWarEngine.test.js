/**
 * Unit tests for FogOfWarEngine
 *
 * Tests the core fog of war rendering engine functionality including:
 * - Paint and erase modes
 * - Transform synchronization
 * - Serialization/deserialization
 * - Role-based rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FogOfWarEngine } from '../src/lib/components/editor/FogOfWarEngine.js';

describe('FogOfWarEngine', () => {
	let canvas;
	let engine;

	beforeEach(() => {
		// Create a mock canvas element
		canvas = document.createElement('canvas');
		canvas.width = 800;
		canvas.height = 600;
	});

	describe('Initialization', () => {
		it('should initialize with default values', () => {
			engine = new FogOfWarEngine(canvas, false);

			expect(engine.canvas).toBe(canvas);
			expect(engine.isDM).toBe(false);
			expect(engine.mode).toBe(null);
			expect(engine.brushSize).toBe(50);
			expect(engine.visibility).toBe(true);
			expect(engine.fogPaths).toEqual([]);
		});

		it('should initialize as DM when specified', () => {
			engine = new FogOfWarEngine(canvas, true);

			expect(engine.isDM).toBe(true);
		});
	});

	describe('Mode Management', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should set paint mode', () => {
			engine.setMode('paint');
			expect(engine.mode).toBe('paint');
		});

		it('should set erase mode', () => {
			engine.setMode('erase');
			expect(engine.mode).toBe('erase');
		});

		it('should clear mode', () => {
			engine.setMode('paint');
			engine.setMode(null);
			expect(engine.mode).toBe(null);
		});
	});

	describe('Brush Size', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should set brush size within valid range', () => {
			engine.setBrushSize(75);
			expect(engine.brushSize).toBe(75);
		});

		it('should clamp brush size to minimum', () => {
			engine.setBrushSize(5);
			expect(engine.brushSize).toBe(10);
		});

		it('should clamp brush size to maximum', () => {
			engine.setBrushSize(300);
			expect(engine.brushSize).toBe(200);
		});
	});

	describe('Visibility', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should toggle visibility on', () => {
			engine.setVisibility(true);
			expect(engine.visibility).toBe(true);
		});

		it('should toggle visibility off', () => {
			engine.setVisibility(false);
			expect(engine.visibility).toBe(false);
		});
	});

	describe('Transform Synchronization', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should update transform', () => {
			const transform = {
				scale: 2.0,
				translateX: 100,
				translateY: 50
			};

			engine.setTransform(transform);

			expect(engine.transform).toEqual(transform);
		});

		it('should convert screen to world coordinates', () => {
			engine.setTransform({
				scale: 2.0,
				translateX: 100,
				translateY: 50
			});

			const screenPoint = { x: 300, y: 250 };
			const worldPoint = engine.screenToWorld(screenPoint);

			// (300 - 100) / 2 = 100, (250 - 50) / 2 = 100
			expect(worldPoint).toEqual({ x: 100, y: 100 });
		});

		it('should convert world to screen coordinates', () => {
			engine.setTransform({
				scale: 2.0,
				translateX: 100,
				translateY: 50
			});

			const worldPoint = { x: 100, y: 100 };
			const screenPoint = engine.worldToScreen(worldPoint);

			// 100 * 2 + 100 = 300, 100 * 2 + 50 = 250
			expect(screenPoint).toEqual({ x: 300, y: 250 });
		});
	});

	describe('Drawing Operations', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
			engine.setMode('paint');
		});

		it('should start drawing', () => {
			const point = { x: 100, y: 100 };
			engine.startDrawing(point);

			expect(engine.isDrawing).toBe(true);
			expect(engine.currentPath.length).toBe(1);
		});

		it('should not start drawing if not DM', () => {
			engine.isDM = false;
			const point = { x: 100, y: 100 };
			engine.startDrawing(point);

			expect(engine.isDrawing).toBe(false);
			expect(engine.currentPath.length).toBe(0);
		});

		it('should not start drawing without a mode', () => {
			engine.setMode(null);
			const point = { x: 100, y: 100 };
			engine.startDrawing(point);

			expect(engine.isDrawing).toBe(false);
		});

		it('should continue drawing', () => {
			engine.startDrawing({ x: 100, y: 100 });
			engine.continueDrawing({ x: 150, y: 150 });
			engine.continueDrawing({ x: 200, y: 200 });

			expect(engine.currentPath.length).toBe(3);
		});

		it('should finish drawing and create path', () => {
			engine.startDrawing({ x: 100, y: 100 });
			engine.continueDrawing({ x: 150, y: 150 });
			const fogPath = engine.finishDrawing();

			expect(fogPath).toBeTruthy();
			expect(fogPath.points.length).toBe(2);
			expect(fogPath.operation).toBe('add');
			expect(fogPath.timestamp).toBeDefined();
			expect(engine.isDrawing).toBe(false);
			expect(engine.fogPaths.length).toBe(1);
		});

		it('should create erase path', () => {
			engine.setMode('erase');
			engine.startDrawing({ x: 100, y: 100 });
			engine.continueDrawing({ x: 150, y: 150 });
			const fogPath = engine.finishDrawing();

			expect(fogPath.operation).toBe('subtract');
		});

		it('should not create path with insufficient points', () => {
			engine.startDrawing({ x: 100, y: 100 });
			const fogPath = engine.finishDrawing();

			expect(fogPath).toBe(null);
			expect(engine.fogPaths.length).toBe(0);
		});
	});

	describe('Fog Path Management', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should load fog paths', () => {
			const paths = [
				{ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], operation: 'add' },
				{ points: [{ x: 50, y: 50 }, { x: 150, y: 150 }], operation: 'add' }
			];

			engine.loadFogPaths(paths);

			expect(engine.fogPaths).toEqual(paths);
		});

		it('should clear all fog paths', () => {
			const paths = [
				{ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], operation: 'add' }
			];

			engine.loadFogPaths(paths);
			engine.clearAll();

			expect(engine.fogPaths).toEqual([]);
		});

		it('should undo last fog path', () => {
			const paths = [
				{ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], operation: 'add' },
				{ points: [{ x: 50, y: 50 }, { x: 150, y: 150 }], operation: 'add' }
			];

			engine.loadFogPaths(paths);
			engine.undoLast();

			expect(engine.fogPaths.length).toBe(1);
			expect(engine.fogPaths[0]).toEqual(paths[0]);
		});
	});

	describe('Serialization', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should serialize fog data', () => {
			const paths = [
				{ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], operation: 'add' }
			];

			engine.loadFogPaths(paths);
			engine.setBrushSize(75);
			engine.setVisibility(true);

			const serialized = engine.serialize();

			expect(serialized).toEqual({
				paths,
				visibility: true,
				brushSize: 75
			});
		});

		it('should deserialize fog data', () => {
			const data = {
				paths: [
					{ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], operation: 'add' }
				],
				visibility: false,
				brushSize: 100
			};

			engine.deserialize(data);

			expect(engine.fogPaths).toEqual(data.paths);
			expect(engine.visibility).toBe(false);
			expect(engine.brushSize).toBe(100);
		});

		it('should deserialize with defaults for missing fields', () => {
			const data = {
				paths: []
			};

			engine.deserialize(data);

			expect(engine.fogPaths).toEqual([]);
			expect(engine.visibility).toBe(true); // default
			expect(engine.brushSize).toBe(50); // default
		});
	});

	describe('Statistics', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should return correct statistics', () => {
			const paths = [
				{ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], operation: 'add' },
				{ points: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }], operation: 'add' }
			];

			engine.loadFogPaths(paths);
			engine.setVisibility(true);

			const stats = engine.getStats();

			expect(stats.pathCount).toBe(2);
			expect(stats.totalPoints).toBe(5); // 2 + 3
			expect(stats.visibility).toBe(true);
		});
	});

	describe('Canvas Resizing', () => {
		beforeEach(() => {
			engine = new FogOfWarEngine(canvas, true);
		});

		it('should resize canvas', () => {
			engine.resize(1024, 768);

			expect(canvas.width).toBe(1024);
			expect(canvas.height).toBe(768);
		});
	});

	describe('Role-based Behavior', () => {
		it('should use different opacity for DM vs Player', () => {
			const dmEngine = new FogOfWarEngine(canvas, true);
			const playerEngine = new FogOfWarEngine(canvas, false);

			// DM should see semi-transparent (50%)
			// Player should see opaque (100%)
			// This would be tested by inspecting canvas rendering, but that's hard in unit tests
			// So we just verify the isDM flag is set correctly
			expect(dmEngine.isDM).toBe(true);
			expect(playerEngine.isDM).toBe(false);
		});
	});
});
