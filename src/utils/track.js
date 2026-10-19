// GoatCounter is already on the page; this only names the events. Counting
// what people actually reach for is the only way the next decisions — whether
// travel time earns its place, whether anyone opens the filters — can be made
// on something other than a hunch.
export function track(name) {
  try {
    window.goatcounter?.count?.({ path: `ev/${name}`, title: name, event: true })
  } catch { /* blocked or not loaded; never worth an error */ }
}
