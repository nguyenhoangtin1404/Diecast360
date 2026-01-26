import { Phone, Facebook, MessageCircle} from 'lucide-react';

export const ContactPage = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1a1a1a',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px',
          }}>
            Liên hệ với chúng tôi
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#666',
            margin: 0,
            lineHeight: '1.6',
          }}>
            Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}>
          {/* Phone */}
          <div style={{
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onClick={() => window.location.href = 'tel:+84123456789'}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#007bff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
            }}>
              <Phone size={32} color="white" />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 8px 0',
            }}>
              Điện thoại
            </h3>
            <a
              href="tel:+84123456789"
              style={{
                fontSize: '18px',
                color: '#007bff',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              0123 456 789
            </a>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '8px 0 0 0',
            }}>
              Gọi ngay để được tư vấn
            </p>
          </div>

          {/* Facebook */}
          <div style={{
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onClick={() => window.open('https://www.facebook.com/diecast360', '_blank')}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#1877f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
            }}>
              <Facebook size={32} color="white" />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 8px 0',
            }}>
              Facebook
            </h3>
            <a
              href="https://www.facebook.com/diecast360"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '18px',
                color: '#1877f2',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              facebook.com/diecast360
            </a>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '8px 0 0 0',
            }}>
              Theo dõi chúng tôi trên Facebook
            </p>
          </div>

          {/* Zalo */}
          <div style={{
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onClick={() => window.open('https://zalo.me/0123456789', '_blank')}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#0068ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(0, 104, 255, 0.3)',
            }}>
              <MessageCircle size={32} color="white" />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 8px 0',
            }}>
              Zalo
            </h3>
            <a
              href="https://zalo.me/0123456789"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '18px',
                color: '#0068ff',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              0123 456 789
            </a>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '8px 0 0 0',
            }}>
              Chat với chúng tôi trên Zalo
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 16px 0',
          }}>
            Thời gian làm việc
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: '0 0 8px 0',
            lineHeight: '1.6',
          }}>
            <strong>Thứ 2 - Chủ nhật:</strong> 9:00 - 21:00
          </p>
          <p style={{
            fontSize: '14px',
            color: '#999',
            margin: '16px 0 0 0',
          }}>
            Chúng tôi luôn sẵn sàng phục vụ bạn!
          </p>
        </div>
      </div>
    </div>
  );
};
