import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Grid, GridSystem, GridCell } from './Grid';

describe('Grid', () => {
    // ---- Render dasar ----
    describe('render dasar', () => {
        it('render tanpa error', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            expect(container.firstChild).toBeDefined();
        });

        it('render data-oxobz-grid-system attribute pada System', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]');
            expect(system).not.toBeNull();
        });

        it('render data-grid dan data-oxobz-grid attribute pada Grid', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            expect(container.querySelector('[data-grid]')).not.toBeNull();
            expect(container.querySelector('[data-oxobz-grid]')).not.toBeNull();
        });

        it('render sebagai section element', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]');
            expect(grid!.tagName.toLowerCase()).toBe('section');
        });
    });

    // ---- Grid.Cell ----
    describe('Grid.Cell', () => {
        it('render cell dengan data-grid-cell dan data-oxobz-grid-cell', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell>1</Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            expect(container.querySelector('[data-grid-cell]')).not.toBeNull();
            expect(container.querySelector('[data-oxobz-grid-cell]')).not.toBeNull();
        });

        it('render children di dalam cell', () => {
            render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell>
                            <div data-testid="cell-content">Hello</div>
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            expect(screen.getByTestId('cell-content')).toBeDefined();
            expect(screen.getByText('Hello')).toBeDefined();
        });

        it('render multiple cells', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell>1</Grid.Cell>
                        <Grid.Cell>2</Grid.Cell>
                        <Grid.Cell>3</Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const cells = container.querySelectorAll('[data-grid-cell]');
            expect(cells.length).toBe(3);
        });
    });

    // ---- Guides ----
    describe('guides', () => {
        it('render guide elements untuk non-responsive grid', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const guides = container.querySelectorAll('[data-grid-guides]');
            expect(guides.length).toBeGreaterThan(0);
        });

        it('render jumlah guide yang benar (columns × rows)', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const guideElements = container.querySelectorAll('[class*="guide"]');
            // 3 columns × 2 rows = 6 guides (inside the guides container)
            // Exclude the guides container itself
            const individualGuides = Array.from(guideElements).filter(
                (el) => !el.hasAttribute('data-grid-guides'),
            );
            expect(individualGuides.length).toBe(6);
        });
    });

    // ---- Debug mode ----
    describe('debug mode', () => {
        it('render systemDebug class ketika debug=true', () => {
            const { container } = render(
                <Grid.System debug>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            expect(system.className).toMatch(/systemDebug/);
        });

        it('render debug overlay ketika debug=true', () => {
            const { container } = render(
                <Grid.System debug>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const overlay = container.querySelector('[class*="systemDebugOverlay"]');
            expect(overlay).not.toBeNull();
        });

        it('tidak render debug overlay ketika debug=false', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const overlay = container.querySelector('[class*="systemDebugOverlay"]');
            expect(overlay).toBeNull();
        });
    });

    // ---- unstable_useContainer ----
    describe('unstable_useContainer', () => {
        it('render unstable_gridSystemWrapper ketika unstable_useContainer=true', () => {
            const { container } = render(
                <Grid.System unstable_useContainer>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const wrapper = container.querySelector('[class*="unstable_gridSystemWrapper"]');
            expect(wrapper).not.toBeNull();
        });

        it('tidak render wrapper ketika unstable_useContainer=false', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const wrapper = container.querySelector('[class*="unstable_gridSystemWrapper"]');
            expect(wrapper).toBeNull();
        });

        it('render useContainer class pada system', () => {
            const { container } = render(
                <Grid.System unstable_useContainer>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            expect(system.className).toMatch(/useContainer/);
        });
    });

    // ---- CSS vars ----
    describe('CSS variables', () => {
        it('set --guide-width ketika guideWidth prop diberikan', () => {
            const { container } = render(
                <Grid.System guideWidth={2}>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            expect(system.style.getPropertyValue('--guide-width')).toBe('2px');
        });

        it('set --grid-columns dan --grid-rows pada Grid', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={5} rows={3} />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]') as HTMLElement;
            expect(grid.style.getPropertyValue('--grid-columns')).toBe('5');
            expect(grid.style.getPropertyValue('--grid-rows')).toBe('3');
        });

        it('set --sm-height ke fit-content sebagai default', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]') as HTMLElement;
            expect(grid.style.getPropertyValue('--sm-height')).toBe('fit-content');
        });
    });

    // ---- className & props forwarding ----
    describe('className dan props forwarding', () => {
        it('forward className ke Grid.System', () => {
            const { container } = render(
                <Grid.System className="custom-system">
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            expect(system.className).toContain('custom-system');
        });

        it('forward className ke Grid', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} className="custom-grid" />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]') as HTMLElement;
            expect(grid.className).toContain('custom-grid');
        });

        it('forward className ke Grid.Cell', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell className="custom-cell">1</Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const cell = container.querySelector('[data-grid-cell]') as HTMLElement;
            expect(cell.className).toContain('custom-cell');
        });

        it('forward data-* attributes', () => {
            const { container } = render(
                <Grid.System data-testid="my-system">
                    <Grid columns={3} rows={2} data-testid="my-grid">
                        <Grid.Cell data-testid="my-cell">1</Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            expect(screen.getByTestId('my-system')).toBeDefined();
            expect(screen.getByTestId('my-grid')).toBeDefined();
            expect(screen.getByTestId('my-cell')).toBeDefined();
        });
    });

    // ---- Ref forwarding ----
    describe('ref forwarding', () => {
        it('forward ref ke Grid.System div', () => {
            const ref = createRef<HTMLDivElement>();
            render(
                <Grid.System ref={ref}>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            expect(ref.current).not.toBeNull();
            expect(ref.current!.tagName.toLowerCase()).toBe('div');
        });

        it('forward ref ke Grid section', () => {
            const ref = createRef<HTMLElement>();
            render(
                <Grid.System>
                    <Grid ref={ref} columns={3} rows={2} />
                </Grid.System>,
            );
            expect(ref.current).not.toBeNull();
            expect(ref.current!.tagName.toLowerCase()).toBe('section');
        });

        it('forward ref ke Grid.Cell div', () => {
            const ref = createRef<HTMLDivElement>();
            render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell ref={ref}>1</Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            expect(ref.current).not.toBeNull();
            expect(ref.current!.tagName.toLowerCase()).toBe('div');
        });
    });

    // ---- displayName ----
    describe('displayName', () => {
        it('Grid mempunyai displayName "Grid"', () => {
            expect(Grid.displayName).toBe('Grid');
        });

        it('GridSystem mempunyai displayName "Grid.System"', () => {
            expect(GridSystem.displayName).toBe('Grid.System');
        });

        it('GridCell mempunyai displayName "Grid.Cell"', () => {
            expect(GridCell.displayName).toBe('Grid.Cell');
        });
    });

    // ---- Named exports ----
    describe('named exports', () => {
        it('exports Grid, GridSystem, GridCell', () => {
            expect(Grid).toBeDefined();
            expect(GridSystem).toBeDefined();
            expect(GridCell).toBeDefined();
        });

        it('Grid.System === GridSystem', () => {
            expect(Grid.System).toBe(GridSystem);
        });

        it('Grid.Cell === GridCell', () => {
            expect(Grid.Cell).toBe(GridCell);
        });
    });
});
