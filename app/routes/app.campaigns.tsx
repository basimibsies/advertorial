import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  EmptyState,
  ResourceList,
  ResourceItem,
  Badge,
  Modal,
  TextField,
} from "@shopify/polaris";
import { TitleBar, Modal as AppBridgeModal } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getPrimaryDomain } from "../lib/shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const advertorials = await prisma.advertorial.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  const primaryDomain = await getPrimaryDomain(admin, shop);
  const advertorialsWithUrls = advertorials.map((a) => ({
    ...a,
    isRunning: !!a.shopifyPageUrl,
    livePageUrl: a.shopifyPageUrl
      ? a.shopifyPageUrl.startsWith("http")
        ? a.shopifyPageUrl
        : `${primaryDomain}${a.shopifyPageUrl.startsWith("/") ? "" : "/"}${a.shopifyPageUrl}`
      : null,
  }));

  return json({ advertorials: advertorialsWithUrls });
};

export default function Campaigns() {
  const { advertorials } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [wizardModalSrc, setWizardModalSrc] = useState("");

  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setCampaignName("");
  };

  const handleCreateCampaign = () => {
    const trimmedName = campaignName.trim();
    if (!trimmedName) return;

    handleCloseCreateModal();
    setWizardModalSrc(`/app/new?modal=true&name=${encodeURIComponent(trimmedName)}`);
    setWizardModalOpen(true);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "WIZARD_DONE") {
        setWizardModalOpen(false);
        navigate(`/app/${event.data.id}`);
      }
      if (event.data?.type === "WIZARD_CLOSE") {
        setWizardModalOpen(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <Page>
      <TitleBar title="Campaigns">
        <Button variant="primary" onClick={handleOpenCreateModal}>
          Create Campaign
        </Button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          {advertorials.length === 0 ? (
            <Card>
              <EmptyState
                heading="Create your first campaign"
                action={{
                  content: "Create Campaign",
                  onAction: handleOpenCreateModal,
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>
                  Generate high-converting advertorials (Story or Listicle style)
                  to run paid traffic on Meta, TikTok, and more.
                </p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <ResourceList
                resourceName={{ singular: "campaign", plural: "campaigns" }}
                items={advertorials}
                renderItem={(item) => {
                  const { id, title, productTitle, template, angle, livePageUrl, isRunning, createdAt } = item;
                  return (
                    <ResourceItem
                      id={id}
                      url={`/app/${id}`}
                      accessibilityLabel={`View ${title}`}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="200">
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {title}
                          </Text>
                          <InlineStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="span">
                              Product: {productTitle}
                            </Text>
                            <Badge>{template}</Badge>
                            <Badge tone="info">{angle}</Badge>
                            {isRunning ? (
                              <Badge tone="success">Running</Badge>
                            ) : (
                              <Badge tone="attention">Draft</Badge>
                            )}
                          </InlineStack>
                          {livePageUrl && (
                            <Text variant="bodySm" as="p">
                              <a
                                href={livePageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {livePageUrl}
                              </a>
                            </Text>
                          )}
                          <Text variant="bodySm" tone="subdued" as="span">
                            Created {new Date(createdAt).toLocaleDateString()}
                          </Text>
                        </BlockStack>
                        {livePageUrl && (
                          <Button
                            url={livePageUrl}
                            target="_blank"
                            variant="plain"
                          >
                            View Page
                          </Button>
                        )}
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>

      <Modal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        title="Create campaign"
        primaryAction={{
          content: "Create",
          disabled: !campaignName.trim(),
          onAction: handleCreateCampaign,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseCreateModal,
          },
        ]}
      >
        <Modal.Section>
          <TextField
            label="Name"
            value={campaignName}
            onChange={setCampaignName}
            autoComplete="off"
            placeholder="My campaign"
          />
        </Modal.Section>
      </Modal>

      <AppBridgeModal
        id="wizard-modal-campaigns"
        src={wizardModalSrc}
        open={wizardModalOpen}
        onHide={() => setWizardModalOpen(false)}
        {...{ variant: "max" } as any}
      >
        <TitleBar title="Create Advertorial" />
      </AppBridgeModal>
    </Page>
  );
}
