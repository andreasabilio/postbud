// Get a value from a `source` object by
// `path` and provide a fallback if not found.
// Like Lodash's _.get()
const get = (source, path, fallback) => {
    const reducer = (value, key) => value[key] || fallback;
    return path.split('.').reduce(reducer, source);
}

// Extract values from `source` and
// store them by full `path`.
const wantedReducer = (source) => (store, path) => {
    const fallback = `["${path}" not found]`;
    store[path] = get(source, path, fallback);

    return store;
};

// Replace occurences of `path` in `string`
// with the values from `store`.
const replaceReducer = (store) => (string, path) => {
    const pattern = `[[${path}]]`;
    const replacement = store[path];

    return string.replace(pattern, replacement);
};

// Find placeholders in string && cleanup
// const findPlaceholders = string => string.match(/\{\{([a-zA-Z.]*)\}\}/gm)
const findPlaceholders = string => {
    return (string.match(/\[\[([a-zA-Z.]*)\]\]/gm) || [])
        .map(m => m.replace('[[', '').replace(']]', ''));
}

// The parser
module.exports = (string, source) => {
    const placeholders = findPlaceholders(string);
    const store = placeholders.reduce(wantedReducer(source), {});
    const wanted = Object.keys(store);

    return wanted.reduce(replaceReducer(store), string);
};
