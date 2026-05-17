export function createPageUrl(pageName?: string) {
  if (!pageName) return '/'

  return '/' + pageName.replace(/ /g, '-')
}
