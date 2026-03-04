const sampleReports = [
  {
    id: 1,
    title: "Illegal Waste Dumping Near Residential Area",
    category: "Environment",
    location: "Hyderabad, India",
    time: "2 hours ago",
    summary:
      "Residents reported continuous dumping of industrial waste near residential zones causing health concerns.",
    images: [
      "https://images.unsplash.com/photo-1581579185169-9c9b1f47c07b",
    ],
    documents: ["Investigation_Report.pdf"],
    likes: 124,
    dislikes: 6,
    commentsEnabled: true,   // ✅ ENABLED
  },
  {
    id: 2,
    title: "Peaceful Protest Demanding Better Public Transport",
    category: "Civil",
    location: "Bengaluru, India",
    time: "5 hours ago",
    summary:
      "Citizens gathered to demand improved bus connectivity and safer public transport infrastructure.",
    images: [],
    documents: [],
    likes: 89,
    dislikes: 3,
    commentsEnabled: true,   // ✅ ENABLED
  },
  {
    id: 3,
    title: "Unreported Road Accident Raises Safety Questions",
    category: "Public Safety",
    location: "Delhi, India",
    time: "Yesterday",
    summary:
      "A late-night accident went unnoticed by media, raising concerns about emergency response systems.",
    images: [],
    documents: ["Accident_Statement.pdf"],
    likes: 57,
    dislikes: 2,
    commentsEnabled: false,  // ❌ DISABLED (intentional example)
  },
];

export default sampleReports;
