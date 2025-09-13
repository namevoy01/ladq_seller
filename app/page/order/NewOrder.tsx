import { useText } from '@/app/_layout';

export default function NewOrder() {
  const Text = useText();

  return (
    <>
      <Text style={{ fontSize: 20 }}>ข้อความปกติ</Text>
      <Text style={{ fontFamily: 'KanitBold', fontSize: 20 }}>ข้อความตัวหนา</Text>
      <Text style={{ fontFamily: 'KanitBlack', fontSize: 22 }}>ข้อความตัวหนามาก</Text>
    </>
  );
}
