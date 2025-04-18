
import BookingForm from "@/components/BookingForm";
import WhyBookWithUs from "@/components/WhyBookWithUs";

const Book = () => {
  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <BookingForm />
      <WhyBookWithUs/>
    </div>
  );
};

export default Book;
