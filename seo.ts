import { MetadataGenerator } from 'metatags-generator'

type MetaContent = {
  title: string
  description: string
  canonical: string
  url: string
  robots: string
  'short-link': string
  'application-name': string
  keywords: string
  locale: string
  'primary-color': string
  'background-color': string
  image: string
  logo: string
}

export default (content: MetaContent) => {
  const settings = {
    structuredData: true,
    androidChromeIcons: true,
    msTags: true,
    safariTags: true,
    appleTags: true,
    openGraphTags: true,
    twitterTags: true,
    facebookTags: true,
  }

  const generator = new MetadataGenerator()

  const icons = ['/path/icon-72x72.png', '/path/icon-180x180.png']

  const data = generator
    .configure(settings)
    .setRobots(content.robots || '')
    .setShortLink(content['short-link'] || '')
    .setProjectMeta({
      name: content['application-name'] || '',
      url: content.url || '',
      logo: content.logo,
      primaryColor: content['primary-color'],
      backgroundColor: content['background-color'],
    })
    .setPageMeta({
      title: content.title || '',
      description: content.description || '',
      url: content.url || '',
      image: content.image,
      keywords: content.keywords,
      locale: content.locale,
    })
    // @ts-ignore
    .openGraphData('article')
    .setCanonical(content.canonical || '')
    .breadcrumb([{ title: 'Home', url: content.url }])
    .setIcons(icons)
    .setTwitterMeta({
      card: 'summary_large_image',
    })
    .build()

  return {
    head: data.head.replace('apple-mobile-web-app-capable', 'mobile-web-app-capable'),
    body: data.body,
  }
}
