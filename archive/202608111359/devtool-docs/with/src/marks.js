/*
 * One drawn mark per command, describing what that command does to the tree:
 * build collapses many files into one directory, watch loops back on a change,
 * check reads without writing, init drops a single file in. They are identity,
 * not decoration — the four commands are otherwise the same shape on the page.
 */

const INK = '%2314161A'
const wrap = (body) =>
  `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${INK}' stroke-width='1.6' stroke-linecap='square'>${body}</svg>`
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/"/g, "'")}")`

export const COMMAND_MARKS = {
  /* three inputs converging into one written directory */
  'quill build': wrap(
    "<path d='M3 5h5M3 12h5M3 19h5'/><path d='M8 5c5 0 5 7 5 7M8 12h5M8 19c5 0 5-7 5-7'/><path d='M13 12h5'/><path d='M18 7v10'/>",
  ),
  /* a loop that returns to the same file */
  'quill watch': wrap(
    "<path d='M5 12a7 7 0 0 1 12-4.9'/><path d='M19 12a7 7 0 0 1-12 4.9'/><path d='M17 3v4.5h-4.5'/><path d='M7 21v-4.5h4.5'/>",
  ),
  /* reads the tree, writes nothing: a tick with an open right edge */
  'quill check': wrap(
    "<path d='M15 4H5v16h10'/><path d='M8 12l2.5 2.5L16 9'/><path d='M19 4v16' stroke-dasharray='2 3'/>",
  ),
  /* one file placed into an empty directory */
  'quill init': wrap(
    "<path d='M4 6h6l2 2.5h8V19H4z' stroke-dasharray='2 3'/><path d='M12 10.5v6M9 13.5h6'/>",
  ),
}
