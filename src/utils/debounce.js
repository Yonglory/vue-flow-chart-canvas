export function debounce(fn, wait = 200) {
  let timer = 0

  function wrapped(...args) {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = 0
      fn(...args)
    }, wait)
  }

  wrapped.cancel = () => {
    window.clearTimeout(timer)
    timer = 0
  }

  wrapped.flush = () => {
    if (!timer) return
    window.clearTimeout(timer)
    timer = 0
    fn()
  }

  return wrapped
}
