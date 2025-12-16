import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Mock matchMedia for MUI
window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () { };
