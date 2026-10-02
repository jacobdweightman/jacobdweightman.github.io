---
layout: post
title:  "To See a Forest, First See a Tree"
date:   2026-09-30 00:00:00 -0600
categories: computation
mathjax: true
---

As I've been known to do, I got weirdly interested in the structure of plants 
for a brief period a long time ago. After working my way through a handful of
research papers and an entire textbook on L-systems, I was dissatisfied with the
existing approaches, tried out some things on my own that didn't really work,
and eventually moved on to new rabbit holes. In particular, I really wanted a
robust measurement method for studying the size and shape of real plants, and I
recently realized that transformer models enable the sort of approach I was
looking for. So in this post, I'll be validating this idea on a toy model, using
3D renders of synthetic "plants" that look something like this, and attempting
to reconstruct the representation of the original tree:

<figure class="attributed-image">
  <img src="{{site.url}}/assets/cv-trees/synthetic_plant.png" alt="A 3D render of a simple synthetic tree">
  <figcaption>
    A 3D render of a simple synthetic tree
  </figcaption>
</figure>

<!--more-->

## The backstory

It was a relatively long chain of events that sparked my curiosity. In the
summer of 2018, I did an NSF REU a few staters over, so I subleased the house
I lived in during the school year to a classmate, and left a few succulents
behind in their care. Missing my houseplants, and being quite broke, I made like
a third-grader and planted a few beans from the grocery store in a paper towel
in glasses to live in the windowsill. I never did get around to putting them in
soil, and much to my surprise they did quite well with just water and sunlight —
a few of them even flowered, and I harvested a few tiny, hollow beans at the end
of the summer program.

All three of my bean plants fared similarly. The beans they started from were
essentially identical coming out of the bag, and after they germinated I still
couldn't have picked them out of a lineup. They put up their two cotyledons,
sprouted their first two true leaves, and kept growing their stems upward. It
wasn't until then that they started to diverge: the details are a bit fuzzy in
my mind, but one of them in particular continued to grow vertically while the
other two grew side branches where the first true leaves were. My exact
observations here aren't really important, but it had me asking questions like:

* How many branches will grow from a single node on the stem?
* When branches grow from a node that has a leaf, will the leaf stay or fall off?
* How much did a segment of stem grow yesterday, and how much will it grow tomorrow?
* Where will the next leaf grow?

All of these questions relate to the size and structure of the plant. What
they're getting at, and what I really wanted to know, was given the complete
history of the size and structure of this individual plant and any relevant
information about its environment, how will its size and structure change in the
future?

If you can't already tell, this is a very big question, and the only simple
answer is "it depends." For example, if one stops watering a plant, it might
wither and die even if it's otherwise healthy. Pests or disease can wreck an
otherwise healthy crop. And even in an incredibly controlled environment, like
my beans in wet paper towels in a windowsill, plants can grow very differently.
Maybe it's the result of small variations in the environment, or the particular
way the embryo was oriented inside each bean, or even just genetic variation
between individuals. Thus, the best answer we can give is, I think, a
probabilistic one: for example, maybe 2/3 of black bean plants of that strain
grow their first branches before the third node of the stem.

Given the broad nature of the question, one would need a lot of data to give
reasonable answers to all the specific questions one might want to ask. And
unfortunately, this data is also pretty hard to collect. I shuddered at the
thought of taking a ruler and protractor to measure distances and angles between
the various nodes and leaves of each plant every day, and even the logistics of
it seemed suspect: just breathing close to a plant makes the leaves shake a
little which would interfere with measurements, and handling a plant even very
gently is probably disruptive. It really seemed like this needed a higher degree
of automation.

I pretty quickly landed on this being a computer vision problem. I'd messed
around with TensorFlow a bit by then, and "knew" to reach for a convolutional
neural net — that was the prevailing wisdom for vision problems, after all.
Modeling the output... well, that's where I got stuck at the time. I ran some
basic experiments with "fixed topologies" in order to give the model a fixed
output size (like a trunk with two branches each with two sub-branches), and
drew a few pictures in MS Paint for an initial experiment. The results were not
very encouraging, and I eventually moved on.


## A Modern Solution

I've picked up some new tricks and machine learning has advanced a lot since
then. For one thing, LLMs exist, so it's never been easier to generate synthetic
data directly or write throwaway scripts that generate it for me. For another,
LLMs exist, so transformer models are all the rage. I suppose if I'd been really
deep into machine translation at the time then I might have known about
transformer models since they were invented in 2017, but oh well. At any rate,
they seem like a great fit for the problem: the original encoder-decoder flavor
of the transformer can ingest an image or set of images through the encoder, and
then autoregressively generate a sequence of _tokens_, which in this situation
will represent a segment of the tree.

Intuitively, the token structure needs to capture the length of the segment, its
direction (which we take as relative to the parent segment), and the number of
children. Thus, we define a token to be a tuple $$(x, y, z, p_0, p_1, p_2, p_3)$$,
where:

* $$x, y, z$$ indicate the endpoint of the new segment in its parents' reference frame, and
* $$p_0, \ldots, p_3$$ are logits indicating the number of children

We take the output sequence to be in depth-first order. This raises the question
of how we know to stop generating tokens; to that end, maintain a counter, $$n$$,
of how many leaves are needed to finish generating the tree. The counter starts
out at 1, so if the "trunk" is also a leaf then generation stops. In general, if
token $$i$$ has $$m$$ children, then $$n_i = n_{i-1} + m - 1$$. If the counter
reaches 0, then we have a complete tree. In order to force termination, we can
set an upper bound $$B$$ and if $$i + n_i \ge B$$ then we mask the outputs to
force the final segments to be leaves. Thus, we never generate more than $$B$$
segments, and always produce a valid tree.

One short session with a chatbot later, I've got a program that generates trees
in our chosen representation and another one that renders them in 3D in the
middle of a ring of cameras. The next step is to define a loss function, train a
model, and see what goes wrong!

Thanks for reading! I'll update with results soon, stay tuned for more 😊