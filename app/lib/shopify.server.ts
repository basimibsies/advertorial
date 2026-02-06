import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  featuredImage?: string;
}

export async function getProducts(admin: AdminApiContext): Promise<Product[]> {
  const response = await admin.graphql(
    `#graphql
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              featuredImage {
                url
              }
            }
          }
        }
      }`,
    {
      variables: {
        first: 50,
      },
    },
  );

  const data = await response.json();
  return (
    data.data?.products?.edges?.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      featuredImage: edge.node.featuredImage?.url,
    })) || []
  );
}

export async function getThemeSettings(
  admin: AdminApiContext,
): Promise<{ primaryColor?: string; fontFamily?: string }> {
  try {
    // Try to get theme settings via GraphQL
    // Note: This is a simplified approach - in production you might want to query the active theme
    const response = await admin.graphql(
      `#graphql
        query getTheme {
          themes(first: 1) {
            edges {
              node {
                id
                name
              }
            }
          }
        }`,
    );

    // For MVP, we'll return defaults and allow manual override
    // In production, you'd query theme settings or use the Theme API
    return {
      primaryColor: undefined, // Will be manually set or use default
      fontFamily: undefined,
    };
  } catch (error) {
    console.error("Error fetching theme settings:", error);
    return {};
  }
}

export async function createShopifyPage(
  admin: AdminApiContext,
  title: string,
  htmlContent: string,
  handle?: string,
): Promise<{ id: string; url: string }> {
  // Generate a handle from title if not provided
  const pageHandle =
    handle ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

  // Set publish date to now to make page immediately live (like GemPages/Replo)
  const publishDate = new Date().toISOString();

  const response = await admin.graphql(
    `#graphql
      mutation pageCreate($page: PageCreateInput!) {
        pageCreate(page: $page) {
          page {
            id
            title
            handle
            onlineStoreUrl
            isPublished
            publishedAt
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        page: {
          title,
          handle: pageHandle,
          body: htmlContent,
          isPublished: true, // Immediately publish the page (like GemPages/Replo)
          publishDate: publishDate, // Set publish date to now
        },
      },
    },
  );

  const data = await response.json();

  if (data.data?.pageCreate?.userErrors?.length > 0) {
    const errors = data.data.pageCreate.userErrors;
    throw new Error(
      `Failed to create page: ${errors.map((e: any) => e.message).join(", ")}`,
    );
  }

  const page = data.data?.pageCreate?.page;
  if (!page) {
    throw new Error("Failed to create page: No page returned");
  }

  return {
    id: page.id,
    url: page.onlineStoreUrl || "",
  };
}
