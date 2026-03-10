import { SiteShell } from '@/components/layout/SiteShell';
import { Container } from '@/components/ui/Container';
import { LegalPage } from '@/features/about/components/LegalPage';

export default function TermsPage() {
  return (
    <SiteShell>
      <Container size="xl" className="py-8 sm:py-12">
        <LegalPage
          title="Terms & Conditions"
          intro="A short, readable version of the terms from your materials, kept friendly and practical for the current MVP."
          sections={[
            {
              heading: 'Vietnamese',
              body: [
                'Chao ban den voi judooo. Ban co the tu do tim kiem va tham khao thong tin tren judooo cho muc dich ca nhan.',
                'Chung minh co gang dam bao thong tin chinh xac va moi nhat, nhung sai sot doi khi van co the xay ra. Hay kiem tra lai thong tin neu can.',
                'judooo co the chua lien ket den nhung trang web khac. Chung minh khong chiu trach nhiem cho noi dung cua cac trang do.',
                'Chung minh co the cap nhat cac dieu khoan nay theo thoi gian va se thong bao nhung thay doi quan trong tren nen tang.',
              ],
            },
            {
              heading: 'English',
              body: [
                'You are free to search and refer to information on judooo for personal use.',
                'We do our best to keep event information accurate and up to date, but mistakes can happen, so please double-check important details when needed.',
                'judooo may include links to external websites. We are not responsible for the content on those sites.',
                'These terms may be updated over time, and important changes will be announced on the platform.',
              ],
            },
          ]}
        />
      </Container>
    </SiteShell>
  );
}
