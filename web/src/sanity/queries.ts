import { defineQuery } from "next-sanity";

// Shared body projection with internal link reference expansion
export const SCHOLARLY_BODY_PROJECTION = /* groq */ `
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" && linkType == "resolved" => {
        "doc": @.reference->{
          _type,
          "slug": slug.current,
          title
        }
      }
    }
  }
`;

// Shared snapshot body projection
export const SNAPSHOT_BODY_PROJECTION = /* groq */ `
  snapshotBody[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" && linkType == "resolved" => {
        "doc": @.reference->{
          _type,
          "slug": slug.current,
          title
        }
      }
    }
  }
`;

// Shared publication metadata settings projection
export const SETTINGS_PROJECTION = /* groq */ `
  *[_type in ["aboutPage", "homePage"]]{
    _type,
    siteTitle,
    authorName,
    authorAffiliation,
    publisher,
    siteDescription,
    canonicalDomain,
    contactEmail
  }
`;

export const ARTICLES_SLUGS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{ "slug": slug.current }`
);

export const HOME_PAGE_QUERY = defineQuery(/* groq */ `{
  "home": *[_id == "homePage"][0]{
    heading,
    subheading,
    intro,
    logo {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions
        }
      },
      hotspot,
      crop
    },
    mottoBanner,
    featuredArticles[]->{
      _id,
      title,
      slug,
      summary,
      contentType,
      featured,
      publishedAt,
      coverEtching {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions
          }
        },
        alt,
        caption,
        hotspot,
        crop
      },
      topics[]->{
        _id,
        name,
        symbol,
        slug
      }
    },
    mediaChannels[]{
      _key,
      platform,
      title,
      description,
      url
    }
  },
  "chapters": *[_type == "chapter"] | order(number asc){
    _id,
    title,
    number,
    slug,
    summary,
    vignette {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions
        }
      },
      alt,
      hotspot,
      crop
    }
  },
  "articles": *[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id,
    title,
    slug,
    summary,
    contentType,
    featured,
    publishedAt,
    coverEtching {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions
        }
      },
      alt,
      caption,
      hotspot,
      crop
    },
    topics[]->{
      _id,
      name,
      symbol,
      slug
    }
  }
}`);

export const CONTENTS_PAGE_QUERY = defineQuery(
  `{
    "chapters": *[_type == "chapter"] | order(number asc){
      _id,
      title,
      number,
      slug,
      summary,
      vignette {
        asset->{
          _id,
          url
        },
        alt
      },
      "articles": *[_type == "article" && references(^._id) && defined(slug.current)] | order(chapterOrder asc, publishedAt desc){
        _id,
        title,
        slug,
        contentType,
        summary,
        chapterOrder,
        publishedAt,
        topics[]->{
          _id,
          name,
          symbol,
          slug
        }
      }
    },
    "standaloneArticles": *[_type == "article" && !defined(chapter) && defined(slug.current)] | order(publishedAt desc){
      _id,
      title,
      slug,
      contentType,
      summary,
      publishedAt,
      topics[]->{
        _id,
        name,
        symbol,
        slug
      }
    },
    "topics": *[_type == "topic"] | order(name asc){
      _id,
      name,
      symbol,
      slug
    }
  }`
);

export const VERSIONS_SLUGS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{ "slug": slug.current }`
);

export const NAVIGATION_QUERY = defineQuery(
  `{
    "topics": *[_type == "topic"] | order(name asc){
      _id,
      name,
      symbol,
      slug
    },
    "chapters": *[_type == "chapter"] | order(number asc){
      _id,
      title,
      number,
      slug,
      "articles": *[_type == "article" && references(^._id) && defined(slug.current)] | order(chapterOrder asc, publishedAt desc){
        _id,
        title,
        slug,
        contentType
      }
    }
  }`
);

export const ARTICLE_QUERY = defineQuery(
  `{
    "article": *[_type == "article" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      contentType,
      summary,
      versionNumber,
      publishedAt,
      coverEtching {
        alt,
        caption,
        asset->
      },
      downloadablePdfs[] {
        title,
        description,
        file {
          asset->{
            url,
            size
          }
        }
      },
      chapter->{
        title,
        "slug": slug.current,
        number
      },
      topics[]->{
        name,
        symbol,
        "slug": slug.current
      },
      body[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" && linkType == "resolved" => {
            "doc": @.reference->{
              _type,
              "slug": slug.current,
              title
            }
          }
        }
      }
    },
    "settings": *[_type in ["aboutPage", "homePage"]]{
      _type,
      siteTitle,
      authorName,
      authorAffiliation,
      publisher,
      siteDescription,
      canonicalDomain,
      contactEmail
    }
  }`
);

export const HISTORICAL_PARAMS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{
    "slug": slug.current,
    versionNumber,
    "snapshots": *[_type == "articleVersion" && article._ref == ^._id]{ versionNumber }
  }`
);

export const HISTORICAL_ARTICLE_QUERY = defineQuery(
  `{
    "article": *[_type == "article" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      contentType,
      summary,
      versionNumber,
      publishedAt,
      versionChangelog,
      coverEtching {
        alt,
        caption,
        asset->
      },
      downloadablePdfs[] {
        title,
        description,
        file {
          asset->{
            url,
            size
          }
        }
      },
      chapter->{
        title,
        "slug": slug.current,
        number
      },
      topics[]->{
        name,
        symbol,
        "slug": slug.current
      },
      body[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" && linkType == "resolved" => {
            "doc": @.reference->{
              _type,
              "slug": slug.current,
              title
            }
          }
        }
      }
    },
    "snapshot": *[_type == "articleVersion" && article->slug.current == $slug && versionNumber == $versionNumber][0]{
      _id,
      versionNumber,
      publishedAt,
      changeSummary,
      snapshotTitle,
      snapshotContentType,
      snapshotSummary,
      snapshotCoverEtching {
        alt,
        caption,
        asset->
      },
      snapshotBody[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" && linkType == "resolved" => {
            "doc": @.reference->{
              _type,
              "slug": slug.current,
              title
            }
          }
        }
      }
    },
    "versionCount": count(*[_type == "articleVersion" && article->slug.current == $slug]),
    "settings": *[_type in ["aboutPage", "homePage"]]{
      _type,
      siteTitle,
      authorName,
      authorAffiliation,
      publisher,
      siteDescription,
      canonicalDomain,
      contactEmail
    }
  }`
);

export const ARTICLE_VERSIONS_QUERY = defineQuery(
  `{
    "article": *[_type == "article" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      contentType,
      summary,
      versionNumber,
      publishedAt,
      versionChangelog,
      coverEtching {
        alt,
        caption,
        asset->
      },
      body[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" && linkType == "resolved" => {
            "doc": @.reference->{
              _type,
              "slug": slug.current,
              title
            }
          }
        }
      }
    },
    "snapshots": *[_type == "articleVersion" && article->slug.current == $slug] | order(versionNumber desc){
      _id,
      versionNumber,
      publishedAt,
      changeSummary,
      snapshotTitle,
      snapshotContentType,
      snapshotSummary,
      snapshotCoverEtching {
        alt,
        caption,
        asset->
      },
      snapshotBody[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" && linkType == "resolved" => {
            "doc": @.reference->{
              _type,
              "slug": slug.current,
              title
            }
          }
        }
      }
    },
    "settings": *[_type in ["aboutPage", "homePage"]]{
      _type,
      siteTitle,
      authorName,
      authorAffiliation,
      publisher,
      siteDescription,
      canonicalDomain,
      contactEmail
    }
  }`
);
