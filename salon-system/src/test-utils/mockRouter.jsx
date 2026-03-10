/**
 * Minimal in-memory router for tests. Use with vi.mock('react-router-dom', () => require('../test-utils/mockRouter'))
 * to avoid loading the real react-router (ESM) in Vitest.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const RouterContext = createContext(null);

function MemoryRouter({ initialEntries = ['/'], initialIndex = 0, children }) {
  const entries = initialEntries.map((e) =>
    typeof e === 'string' ? { pathname: e, state: null } : { pathname: e.pathname || '/', state: e.state ?? null }
  );
  const [state, setState] = useState({ entries, index: initialIndex });
  const location = state.entries[state.index] || { pathname: '/', state: null };
  const navigate = useCallback((path, opts) => {
    setState({
      entries: [{ pathname: path, state: (opts && opts.state) || null }],
      index: 0,
    });
  }, []);
  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

function Routes({ children }) {
  const { location } = useContext(RouterContext);
  const childArray = React.Children.toArray(children);
  for (const child of childArray) {
    if (child.props.path === location.pathname) {
      return child.props.element;
    }
  }
  return null;
}

function Route({ path, element }) {
  return null;
}

function useLocation() {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.location : { pathname: '/', state: null };
}

function useNavigate() {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.navigate : () => {};
}

function Link({ to, children, ...rest }) {
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}

export { MemoryRouter, Routes, Route, useLocation, useNavigate, Link };
