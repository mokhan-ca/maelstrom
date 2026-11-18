export default function bindAll(object, ...names) {
  for (const name of names) {
    object[name] = object[name].bind(object);
  }
}
