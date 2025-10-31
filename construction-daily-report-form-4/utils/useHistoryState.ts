import { useState, useRef, useCallback } from 'react';

export const useHistoryState = <T>(initialState: T) => {
  const [state, _setState] = useState(initialState);
  const history = useRef([initialState]);
  const pointer = useRef(0);

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    _setState(prevState => {
      const resolvedState = typeof newState === 'function' ? (newState as (prevState: T) => T)(prevState) : newState;

      // If we have undone actions, slice the future history off before adding a new state
      if (pointer.current < history.current.length - 1) {
        history.current = history.current.slice(0, pointer.current + 1);
      }

      history.current.push(resolvedState);
      pointer.current = history.current.length - 1;
      
      return resolvedState;
    });
  }, []);

  const undo = useCallback(() => {
    if (pointer.current > 0) {
      pointer.current--;
      _setState(history.current[pointer.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (pointer.current < history.current.length - 1) {
      pointer.current++;
      _setState(history.current[pointer.current]);
    }
  }, []);

  const canUndo = pointer.current > 0;
  const canRedo = pointer.current < history.current.length - 1;
  
  const resetState = useCallback((newState: T) => {
      history.current = [newState];
      pointer.current = 0;
      _setState(newState);
  }, []);

  return { state, setState, undo, redo, canUndo, canRedo, resetState };
};
