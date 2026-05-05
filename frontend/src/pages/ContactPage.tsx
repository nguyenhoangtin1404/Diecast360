import { useMemo, type ReactNode, type MouseEvent } from 'react';
import { Phone, Facebook, MessageCircle } from 'lucide-react';
import { usePublicShopContext } from '../hooks/usePublicShopContext';
import { usePublicShopContact } from '../hooks/usePublicShopContact';

/** Only allow http(s) links in href / window.open to avoid javascript: and other schemes. */
function safeHttpUrl(url: string | undefined): string {
  if (!url) return '';
  const t = url.trim();
  if (!t) return '';
  try {
    const p = new URL(t);
    return p.protocol === 'http:' || p.protocol === 'https:' ? t : '';
  } catch {
    return '';
  }
}

function renderInlineBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    const key = `p${i}:${part.length}:${part.slice(0, 24)}`;
    if (m) {
      return (
        <strong key={key} style={{ fontWeight: 600, color: '#1a1a1a' }}>
          {m[1]}
        </strong>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

export const ContactPage = () => {
  const { effectiveShopId, shopContextReady, publicApiShopReady } = usePublicShopContext();

  const { data, isLoading, error } = usePublicShopContact();

  const contact = data?.contact;

  const facebookUrl = safeHttpUrl(contact?.facebook?.url);
  const zaloUrl = safeHttpUrl(contact?.zalo?.url);

  const phoneTelHref = useMemo(() => {
    const raw = contact?.phone?.tel?.trim() ?? '';
    if (!raw) return '';
    const withScheme = raw.startsWith('tel:') ? raw : `tel:${raw}`;
    return withScheme;
  }, [contact?.phone?.tel]);

  if (!shopContextReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
    );
  }

  if (!publicApiShopReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 8 }}>Chưa chọn cửa hàng</h2>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
          Thêm{' '}
          <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>
            ?shop_id=
          </code>{' '}
          vào URL (UUID hoặc slug), hoặc cấu hình{' '}
          <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>
            VITE_PUBLIC_CATALOG_SHOP_ID
          </code>{' '}
          khi build.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải liên hệ...</div>
    );
  }

  if (error || !contact) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#b91c1c' }}>
        Không tải được thông tin liên hệ. Thử lại sau.
      </div>
    );
  }

  const cardHoverEnter = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
  };
  const cardHoverLeave = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  };

  const linkHoverEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.textDecoration = 'underline';
  };
  const linkHoverLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.textDecoration = 'none';
  };

  const showPhone = Boolean(contact.phone?.tel?.trim() || contact.phone?.label?.trim());
  const showFacebook = Boolean(facebookUrl);
  const showZalo = Boolean(zaloUrl);

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1a1a1a',
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px',
            }}
          >
            {contact.page_title || 'Liên hệ'}
          </h1>
          {contact.page_subtitle ? (
            <p
              style={{
                fontSize: '18px',
                color: '#666',
                margin: 0,
                lineHeight: '1.6',
              }}
            >
              {contact.page_subtitle}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {showPhone ? (
            <div
              style={{
                backgroundColor: '#fff',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: phoneTelHref ? 'pointer' : 'default',
              }}
              onMouseEnter={cardHoverEnter}
              onMouseLeave={cardHoverLeave}
              onClick={() => {
                if (phoneTelHref) window.location.href = phoneTelHref;
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#007bff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                }}
              >
                <Phone size={32} color="white" />
              </div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 8px 0',
                }}
              >
                {contact.phone?.title || 'Điện thoại'}
              </h3>
              {phoneTelHref ? (
                <a
                  href={phoneTelHref}
                  style={{
                    fontSize: '18px',
                    color: '#007bff',
                    textDecoration: 'none',
                    fontWeight: '500',
                    display: 'block',
                  }}
                  onMouseEnter={linkHoverEnter}
                  onMouseLeave={linkHoverLeave}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.phone?.label?.trim() || contact.phone?.tel?.trim()}
                </a>
              ) : (
                <span
                  style={{
                    fontSize: '18px',
                    color: '#007bff',
                    fontWeight: '500',
                    display: 'block',
                  }}
                >
                  {contact.phone?.label?.trim()}
                </span>
              )}
              {contact.phone?.hint ? (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: '8px 0 0 0',
                  }}
                >
                  {contact.phone.hint}
                </p>
              ) : null}
            </div>
          ) : null}

          {showFacebook ? (
            <div
              style={{
                backgroundColor: '#fff',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={cardHoverEnter}
              onMouseLeave={cardHoverLeave}
              onClick={() => {
                if (facebookUrl) window.open(facebookUrl, '_blank');
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#1877f2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
                }}
              >
                <Facebook size={32} color="white" />
              </div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 8px 0',
                }}
              >
                {contact.facebook?.title || 'Facebook'}
              </h3>
              <a
                href={facebookUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '18px',
                  color: '#1877f2',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'block',
                  wordBreak: 'break-word',
                }}
                onMouseEnter={linkHoverEnter}
                onMouseLeave={linkHoverLeave}
                onClick={(e) => e.stopPropagation()}
              >
                {contact.facebook?.label?.trim() ||
                  contact.facebook?.url?.replace(/^https?:\/\//, '')}
              </a>
              {contact.facebook?.hint ? (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: '8px 0 0 0',
                  }}
                >
                  {contact.facebook.hint}
                </p>
              ) : null}
            </div>
          ) : null}

          {showZalo ? (
            <div
              style={{
                backgroundColor: '#fff',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={cardHoverEnter}
              onMouseLeave={cardHoverLeave}
              onClick={() => {
                if (zaloUrl) window.open(zaloUrl, '_blank');
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#0068ff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 12px rgba(0, 104, 255, 0.3)',
                }}
              >
                <MessageCircle size={32} color="white" />
              </div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 8px 0',
                }}
              >
                {contact.zalo?.title || 'Zalo'}
              </h3>
              <a
                href={zaloUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '18px',
                  color: '#0068ff',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'block',
                }}
                onMouseEnter={linkHoverEnter}
                onMouseLeave={linkHoverLeave}
                onClick={(e) => e.stopPropagation()}
              >
                {contact.zalo?.label?.trim() || contact.zalo?.url?.trim()}
              </a>
              {contact.zalo?.hint ? (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: '8px 0 0 0',
                  }}
                >
                  {contact.zalo.hint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {!showPhone && !showFacebook && !showZalo ? (
          <p
            style={{
              textAlign: 'center',
              color: '#64748b',
              marginBottom: '32px',
              fontSize: '15px',
            }}
          >
            Cửa hàng chưa cập nhật kênh liên hệ. Vui lòng quay lại sau hoặc xem danh mục sản phẩm.
          </p>
        ) : null}

        <div
          style={{
            backgroundColor: '#f9f9f9',
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 16px 0',
            }}
          >
            {contact.hours?.title || 'Thời gian làm việc'}
          </h2>
          {contact.hours?.schedule_line ? (
            <p
              style={{
                fontSize: '16px',
                color: '#666',
                margin: '0 0 8px 0',
                lineHeight: '1.6',
              }}
            >
              {renderInlineBold(contact.hours.schedule_line)}
            </p>
          ) : null}
          {contact.hours?.footer_note ? (
            <p
              style={{
                fontSize: '14px',
                color: '#999',
                margin: '16px 0 0 0',
              }}
            >
              {contact.hours.footer_note}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
