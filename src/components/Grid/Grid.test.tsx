import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Grid, GridSystem, GridCell } from './Grid';

/** Find a guide element inside a container by its --x / --y CSS variables. */
function findGuide(container: HTMLElement, x: number, y: number, scope?: HTMLElement): HTMLElement | undefined {
    const root = scope ?? container;
    return Array.from(root.querySelectorAll<HTMLElement>('[class*="guide"]')).find(
        (el) =>
            !el.hasAttribute('data-grid-guides') &&
            el.style.getPropertyValue('--x') === String(x) &&
            el.style.getPropertyValue('--y') === String(y),
    );
}

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

        it('auto cell mengeluarkan --sm-grid-row/column/cell-rows/cell-columns = auto', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell>1</Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const cell = container.querySelector('[data-grid-cell]') as HTMLElement;
            expect(cell.style.getPropertyValue('--sm-grid-row')).toBe('auto');
            expect(cell.style.getPropertyValue('--sm-grid-column')).toBe('auto');
            expect(cell.style.getPropertyValue('--sm-cell-rows')).toBe('auto');
            expect(cell.style.getPropertyValue('--sm-cell-columns')).toBe('auto');
        });

        it('menurunkan cell span dari placement "a/b" (grid-column & cell-columns)', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={12} rows={3}>
                        <Grid.Cell column="3/10" row="2/4">
                            Lorem
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const cell = container.querySelector('[data-grid-cell]') as HTMLElement;
            expect(cell.style.getPropertyValue('--sm-grid-column')).toBe('3/10');
            expect(cell.style.getPropertyValue('--sm-cell-columns')).toBe('7');
            expect(cell.style.getPropertyValue('--sm-grid-row')).toBe('2/4');
            expect(cell.style.getPropertyValue('--sm-cell-rows')).toBe('2');
        });

        it('placement angka tunggal diformat "N / span 1"', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell column={2} row={1}>
                            x
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const cell = container.querySelector('[data-grid-cell]') as HTMLElement;
            expect(cell.style.getPropertyValue('--sm-grid-column')).toBe('2 / span 1');
            expect(cell.style.getPropertyValue('--sm-cell-columns')).toBe('1');
        });
    });

    // ---- Guides (non-responsive) ----
    describe('guides', () => {
        it('render guide elements untuk non-responsive grid', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const guides = container.querySelectorAll('[data-grid-guides]');
            expect(guides.length).toBe(1);
        });

        it('render jumlah guide yang benar (columns × rows)', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const guideElements = container.querySelectorAll('[class*="guide"]');
            const individualGuides = Array.from(guideElements).filter(
                (el) => !el.hasAttribute('data-grid-guides'),
            );
            expect(individualGuides.length).toBe(6);
        });

        it('menghapus border kanan pada kolom terakhir & border bawah pada baris terakhir', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            // last column, first row -> only right removed
            expect(findGuide(container, 3, 1)!.style.borderRightStyle).toBe('none');
            expect(findGuide(container, 3, 1)!.style.borderBottomStyle).toBe('');
            // first column, last row -> only bottom removed
            expect(findGuide(container, 1, 2)!.style.borderBottomStyle).toBe('none');
            expect(findGuide(container, 1, 2)!.style.borderRightStyle).toBe('');
            // last column, last row -> both removed
            expect(findGuide(container, 3, 2)!.style.borderRightStyle).toBe('none');
            expect(findGuide(container, 3, 2)!.style.borderBottomStyle).toBe('none');
        });
    });

    // ---- hideGuides ----
    describe('hideGuides', () => {
        it('hideGuides="row" menghapus semua border bawah', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} hideGuides="row" />
                </Grid.System>,
            );
            for (let x = 1; x <= 3; x++) {
                for (let y = 1; y <= 2; y++) {
                    expect(findGuide(container, x, y)!.style.borderBottomStyle).toBe('none');
                }
            }
        });

        it('hideGuides="column" menghapus semua border kanan', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} hideGuides="column" />
                </Grid.System>,
            );
            for (let x = 1; x <= 3; x++) {
                for (let y = 1; y <= 2; y++) {
                    expect(findGuide(container, x, y)!.style.borderRightStyle).toBe('none');
                }
            }
        });
    });

    // ---- solid clipping ----
    describe('solid clipping', () => {
        it('sel solid meng-clip guide interior (border kanan & bawah)', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={3}>
                        <Grid.Cell column="1/3" row="1/3" solid>
                            1 + 2
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            // (1,1): interior of solid -> both borders removed
            expect(findGuide(container, 1, 1)!.style.borderRightStyle).toBe('none');
            expect(findGuide(container, 1, 1)!.style.borderBottomStyle).toBe('none');
            // (2,1): rightmost covered column, top row -> only bottom removed
            expect(findGuide(container, 2, 1)!.style.borderBottomStyle).toBe('none');
            expect(findGuide(container, 2, 1)!.style.borderRightStyle).toBe('');
            // (1,2): bottom covered row, left column -> only right removed
            expect(findGuide(container, 1, 2)!.style.borderRightStyle).toBe('none');
            expect(findGuide(container, 1, 2)!.style.borderBottomStyle).toBe('');
            // (2,2): cell edge (bottom-right corner of the solid) -> no clip
            expect(findGuide(container, 2, 2)!.style.borderRightStyle).toBe('');
            expect(findGuide(container, 2, 2)!.style.borderBottomStyle).toBe('');
        });

        it('sel NON-solid tidak meng-clip guide', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={3}>
                        <Grid.Cell column="1/3" row="1/3">
                            plain
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            expect(findGuide(container, 1, 1)!.style.borderRightStyle).toBe('');
            expect(findGuide(container, 1, 1)!.style.borderBottomStyle).toBe('');
        });

        it('mendukung line negatif "1/-1" (menjangkau seluruh sumbu)', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={12} rows={3}>
                        <Grid.Cell column="7/12" row="1/-1" solid>
                            3
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            // covers columns 7..11, rows 1..3 -> interior right borders removed on x 7..10 for every row
            for (let y = 1; y <= 3; y++) {
                for (let x = 7; x <= 10; x++) {
                    expect(findGuide(container, x, y)!.style.borderRightStyle).toBe('none');
                }
            }
            // x=11 is the rightmost covered column -> its own right border stays
            expect(findGuide(container, 11, 2)!.style.borderRightStyle).toBe('');
        });
    });

    // ---- responsive guides ----
    describe('responsive guides', () => {
        it('render 5 guide container (satu per breakpoint) untuk columns/rows object', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }} />
                </Grid.System>,
            );
            const guideContainers = container.querySelectorAll('[data-grid-guides]');
            expect(guideContainers.length).toBe(5);
        });

        it('setiap breakpoint memakai jumlah kolom/baris yang benar', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }} />
                </Grid.System>,
            );
            // xs & sm -> 1x6 (6), smd & md -> 2x3 (6), lg -> 3x2 (6). total 30
            const individualGuides = Array.from(
                container.querySelectorAll('[class*="guide"]'),
            ).filter((el) => !el.hasAttribute('data-grid-guides'));
            expect(individualGuides.length).toBe(30);
        });

        it('menerapkan kelas breakpoint pada guide (xsGuide..lgGuide)', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }} />
                </Grid.System>,
            );
            for (const bp of ['xsGuide', 'smGuide', 'smdGuide', 'mdGuide', 'lgGuide']) {
                expect(container.querySelector(`[class*="${bp}"]`)).not.toBeNull();
            }
        });

        it('lg breakpoint (3 kolom) menghapus border kanan pada kolom 3', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }} />
                </Grid.System>,
            );
            const lgContainer = Array.from(
                container.querySelectorAll<HTMLElement>('[data-grid-guides]'),
            ).find((c) => c.querySelector('[class*="lgGuide"]'))!;
            expect(lgContainer).toBeDefined();
            // lg grid is 3x2: guide (3,1) is last column -> right border removed
            expect(findGuide(container, 3, 1, lgContainer)!.style.borderRightStyle).toBe('none');
        });

        it('clip responsif: solid cell meng-clip per breakpoint', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }}>
                        <Grid.Cell
                            column={{ sm: 1, md: '1/3', lg: '2/4' }}
                            row={{ sm: '5/7', md: 3, lg: 2 }}
                            solid
                        >
                            5 + 6
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const smdContainer = Array.from(
                container.querySelectorAll<HTMLElement>('[data-grid-guides]'),
            ).find((c) => c.querySelector('[class*="smdGuide"]'))!;
            // smd is 2x3, cell spans columns 1..2 row 3 -> guide (1,3) right border removed
            expect(findGuide(container, 1, 3, smdContainer)!.style.borderRightStyle).toBe('none');
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

    // ---- dashedGuides ----
    describe('dashedGuides', () => {
        it('render systemDashed class ketika dashedGuides=true', () => {
            const { container } = render(
                <Grid.System dashedGuides>
                    <Grid columns={1} rows={1} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            expect(system.className).toMatch(/systemDashed/);
        });

        it('tidak render systemDashed class secara default', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={1} rows={1} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            expect(system.className).not.toMatch(/systemDashed/);
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

        it('gridSystemLazyContent berada DI DALAM gridSystem (setelah children)', () => {
            const { container } = render(
                <Grid.System unstable_useContainer>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            const lazy = system.querySelector('[class*="gridSystemLazyContent"]');
            expect(lazy).not.toBeNull();
            // section (children) must come before lazyContent
            const section = system.querySelector('section');
            expect(section!.compareDocumentPosition(lazy!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('debug overlay dirender SETELAH gridSystemLazyContent', () => {
            const { container } = render(
                <Grid.System unstable_useContainer debug>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            const system = container.querySelector('[data-oxobz-grid-system]') as HTMLElement;
            const lazy = system.querySelector('[class*="gridSystemLazyContent"]')!;
            const overlay = system.querySelector('[class*="systemDebugOverlay"]')!;
            expect(lazy.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('tidak render gridSystemLazyContent tanpa unstable_useContainer', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} />
                </Grid.System>,
            );
            expect(container.querySelector('[class*="gridSystemLazyContent"]')).toBeNull();
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

        it('set --grid-columns dan --grid-rows pada Grid non-responsif', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={5} rows={3} />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]') as HTMLElement;
            expect(grid.style.getPropertyValue('--grid-columns')).toBe('5');
            expect(grid.style.getPropertyValue('--grid-rows')).toBe('3');
        });

        it('set --sm/--md/--lg-grid-columns pada Grid responsif', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }} />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]') as HTMLElement;
            expect(grid.style.getPropertyValue('--sm-grid-columns')).toBe('1');
            expect(grid.style.getPropertyValue('--md-grid-columns')).toBe('2');
            expect(grid.style.getPropertyValue('--lg-grid-columns')).toBe('3');
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

        it('set --sm-height preserve-aspect-ratio', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2} height="preserve-aspect-ratio" />
                </Grid.System>,
            );
            const grid = container.querySelector('[data-oxobz-grid]') as HTMLElement;
            expect(grid.style.getPropertyValue('--sm-height')).toContain('calc(');
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
            render(
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

        it('tidak membocorkan prop solid sebagai atribut DOM', () => {
            const { container } = render(
                <Grid.System>
                    <Grid columns={3} rows={2}>
                        <Grid.Cell column="1/3" row="1" solid>
                            1
                        </Grid.Cell>
                    </Grid>
                </Grid.System>,
            );
            const cell = container.querySelector('[data-grid-cell]') as HTMLElement;
            expect(cell.hasAttribute('solid')).toBe(false);
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
