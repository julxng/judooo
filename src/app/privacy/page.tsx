import { SiteShell } from '@/components/layout/SiteShell';
import { Container } from '@/components/ui/Container';
import { LegalPage } from '@/features/about/components/LegalPage';

export default function PrivacyPage() {
  return (
    <SiteShell>
      <Container size="xl" className="py-8 sm:py-12">
        <LegalPage
          title="Privacy Policy"
          intro="This page keeps the privacy copy from your docs in a launch-ready format for the current site."
          sections={[
            {
              heading: 'Vietnamese',
              body: [
                'judooo chi thu thap nhung thong tin can thiet de van hanh nen tang, vi du nhu thong tin ban cung cap khi lien he voi chung minh.',
                'Thong tin nay duoc su dung de tra loi cau hoi, cai thien judooo va giu lien lac neu ban muon. Chung minh khong chia se thong tin cua ban voi ben thu ba khi chua co su dong y.',
                'Chung minh co the su dung cookies de cai thien trai nghiem. Ban co the tat cookies trong trinh duyet neu muon.',
                'Chung minh ap dung cac bien phap bao mat hop ly, nhung khong co phuong phap truyen du lieu nao tren internet la tuyet doi an toan.',
              ],
            },
            {
              heading: 'English',
              body: [
                'We only collect the information needed to operate judooo effectively, such as details you provide when contacting us.',
                'That information is used to answer questions, improve the site, and stay in touch if you want us to.',
                'We may use cookies to improve the browsing experience. You can disable cookies in your browser if you prefer.',
                'Reasonable security measures are applied, but no internet transmission method is completely secure.',
              ],
            },
          ]}
        />
      </Container>
    </SiteShell>
  );
}
